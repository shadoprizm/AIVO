import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  siteId: string;
}

interface CategoryScores {
  content_clarity: number;
  semantic_structure: number;
  schema_metadata: number;
  qa_readiness: number;
  authority_trust: number;
  technical_accessibility: number;
}

interface Recommendation {
  id: string;
  category: keyof CategoryScores;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  suggested_fix: string;
  implementation_effort: 'low' | 'medium' | 'high';
}

interface AnalysisJson {
  overall_score: number;
  category_scores: CategoryScores;
  recommendations: Recommendation[];
  notes?: string[];
  warnings?: string[];
  analyzed_at: string;
  analysis_version: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { siteId }: RequestBody = await req.json();

    if (!siteId) {
      throw new Error('Missing siteId');
    }

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('*')
      .eq('id', siteId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (siteError || !site) {
      throw new Error('Site not found or unauthorized');
    }

    const recentScansResult = await supabase
      .from('scans')
      .select('created_at')
      .eq('site_id', siteId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentScansResult.data && recentScansResult.data.length >= 5) {
      throw new Error('Rate limit: Maximum 5 scans per hour per site');
    }

    const { data: newScan, error: insertError } = await supabase
      .from('scans')
      .insert({
        site_id: siteId,
        status: 'processing',
      })
      .select()
      .single();

    if (insertError || !newScan) {
      throw new Error('Failed to create scan');
    }

    let htmlContent = '';
    let fetchError = null;

    try {
      const response = await fetch(site.url, {
        headers: {
          'User-Agent': 'AIVO-Insights-Bot/1.0',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        htmlContent = await response.text();
        if (htmlContent.length > 100000) {
          htmlContent = htmlContent.substring(0, 100000);
        }
      } else {
        fetchError = `HTTP ${response.status}`;
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Failed to fetch';
    }

    let analysisJson: AnalysisJson | null = null;
    let overallScore = 0;
    let status = 'failed';

    if (!fetchError && htmlContent && openaiApiKey) {
      try {
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: `You are an AI visibility optimization expert. Analyze websites for how well AI language models (ChatGPT, Claude, Gemini) can interpret and cite their content.

Evaluate these categories (0-100 each):

1. content_clarity: Clear, factual writing with short paragraphs and scannable structure
2. semantic_structure: Proper HTML5 semantic tags, heading hierarchy (H1>H2>H3), logical document outline
3. schema_metadata: Schema.org markup, Open Graph tags, meta descriptions
4. qa_readiness: FAQ sections, Q&A formatting, definition lists, explicit questions with answers
5. authority_trust: Author credentials, publication dates, source citations, expertise signals
6. technical_accessibility: Fast loading, mobile-friendly, clean HTML, no JavaScript barriers

Provide 3-5 actionable recommendations prioritized by impact.

Return ONLY valid JSON matching this exact structure:
{
  "overall_score": 75,
  "category_scores": {
    "content_clarity": 80,
    "semantic_structure": 70,
    "schema_metadata": 60,
    "qa_readiness": 75,
    "authority_trust": 85,
    "technical_accessibility": 90
  },
  "recommendations": [
    {
      "id": "rec-1",
      "category": "semantic_structure",
      "severity": "high",
      "title": "Brief title",
      "description": "Detailed explanation",
      "suggested_fix": "Concrete implementation steps",
      "implementation_effort": "low"
    }
  ],
  "notes": ["Positive observations"],
  "warnings": ["Critical issues"]
}`,
              },
              {
                role: 'user',
                content: `Analyze this website HTML for AI visibility:\n\nURL: ${site.url}\n\nHTML:\n${htmlContent}`,
              },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          }),
        });

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json();
          const content = openaiData.choices[0]?.message?.content;

          if (content) {
            const parsedAnalysis = JSON.parse(content);
            analysisJson = {
              ...parsedAnalysis,
              analyzed_at: new Date().toISOString(),
              analysis_version: '1.0',
            };
            overallScore = analysisJson.overall_score;
            status = 'completed';
          }
        } else {
          console.error('OpenAI API error:', await openaiResponse.text());
          throw new Error('OpenAI analysis failed');
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
        status = 'failed';
      }
    } else if (!fetchError && htmlContent) {
      const hasH1 = /<h1[^>]*>/.test(htmlContent);
      const hasHeadings = /<h[2-6][^>]*>/.test(htmlContent);
      const hasSemanticTags = /<(article|section|nav|aside|header|footer)[^>]*>/.test(htmlContent);
      const hasMeta = /<meta[^>]*>/.test(htmlContent);
      const contentLength = htmlContent.length;

      let score = 50;
      if (hasH1) score += 10;
      if (hasHeadings) score += 10;
      if (hasSemanticTags) score += 15;
      if (hasMeta) score += 10;
      if (contentLength > 5000) score += 5;

      overallScore = Math.min(score, 100);

      analysisJson = {
        overall_score: overallScore,
        category_scores: {
          content_clarity: hasH1 ? 70 : 50,
          semantic_structure: hasSemanticTags ? 75 : 40,
          schema_metadata: hasMeta ? 60 : 30,
          qa_readiness: 50,
          authority_trust: 50,
          technical_accessibility: contentLength > 0 ? 80 : 50,
        },
        recommendations: [
          {
            id: 'rec-basic',
            category: 'semantic_structure',
            severity: 'medium',
            title: 'Basic analysis performed',
            description: 'OpenAI integration not configured. This is a basic structural analysis.',
            suggested_fix: 'Configure OpenAI API key for detailed AI visibility analysis.',
            implementation_effort: 'low',
          },
        ],
        notes: ['Basic HTML structure analysis completed'],
        analyzed_at: new Date().toISOString(),
        analysis_version: '1.0',
      };
      status = 'completed';
    }

    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status,
        overall_score: status === 'completed' ? overallScore : null,
        analysis_json: status === 'completed' ? analysisJson : null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', newScan.id);

    if (updateError) {
      console.error('Failed to update scan:', updateError);
    }

    if (status === 'completed') {
      await supabase
        .from('sites')
        .update({ last_scanned_at: new Date().toISOString() })
        .eq('id', siteId);
    }

    const { data: updatedScan } = await supabase
      .from('scans')
      .select('*')
      .eq('id', newScan.id)
      .single();

    return new Response(
      JSON.stringify(updatedScan || newScan),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});