import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { marked } from "npm:marked@12";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BlogTopic {
  category: string;
  title: string;
  focusKeywords: string[];
  targetQuestions: string[];
  subtopics: string[];
}

interface CoverImageResult {
  url: string;
  author?: string;
  authorUrl?: string;
  source?: string;
}

interface StoredBlogPost {
  id: string;
  title?: string;
  slug?: string;
  content?: string;
  content_format?: string | null;
  excerpt?: string;
  author_name?: string;
  author_email?: string | null;
  cover_image_url?: string | null;
  image_author?: string | null;
  image_author_url?: string | null;
  image_source?: string | null;
  tags?: string[];
  published?: boolean;
  published_at: string | null;
  created_at: string;
  updated_at?: string | null;
  meta_description?: string | null;
  reading_time_minutes?: number | null;
}

interface PexelsPhoto {
  src?: {
    large2x?: string;
    large?: string;
    original?: string;
  };
  photographer?: string;
  photographer_url?: string;
}

const PEXELS_API_URL = "https://api.pexels.com/v1/search";
// Production fallback is intentional for Edge Functions that cannot import Vite site config.
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://aivoinsights.com").replace(/\/$/, "");
const FALLBACK_COVER_IMAGE_URL = `${SITE_URL}/og-image.png`;

const adminEmails = (Deno.env.get("ADMIN_EMAILS") ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const BLOG_TOPICS: BlogTopic[] = [
  {
    category: 'AI Visibility Fundamentals',
    title: 'What is AI Visibility and Why It Matters for Your Website in 2025',
    focusKeywords: ['AI visibility', 'AI discoverability', 'AI search optimization', 'LLM citations'],
    targetQuestions: [
      'What is AI visibility?',
      'Why does AI visibility matter?',
      'How do AI models discover content?',
      'What is the difference between SEO and AI visibility?'
    ],
    subtopics: [
      'Definition and core concepts',
      'How AI models index and retrieve information',
      'The shift from traditional SEO to AI optimization',
      'Real-world impact on traffic and citations',
      'Future trends in AI-powered search'
    ]
  },
  {
    category: 'Schema Markup',
    title: 'Complete Guide to Schema Markup for AI Model Optimization',
    focusKeywords: ['schema markup', 'structured data', 'schema.org', 'JSON-LD', 'AI readability'],
    targetQuestions: [
      'What is schema markup?',
      'How does schema markup help AI models?',
      'Which schema types should I implement?',
      'How do I add schema markup to my website?'
    ],
    subtopics: [
      'Understanding structured data and schema.org',
      'Essential schema types for AI visibility',
      'Implementing JSON-LD vs Microdata',
      'Schema markup for articles, products, and FAQs',
      'Testing and validating schema markup'
    ]
  },
  {
    category: 'Content Optimization',
    title: 'How to Write Content That AI Models Can Understand and Cite',
    focusKeywords: ['AI-optimized content', 'semantic content', 'content structure', 'clear writing'],
    targetQuestions: [
      'How should I structure content for AI models?',
      'What makes content AI-readable?',
      'How do I improve content clarity for AI?',
      'What content formats do AI models prefer?'
    ],
    subtopics: [
      'Clear hierarchical structure with headings',
      'Writing concise, definitive answers',
      'Using semantic HTML properly',
      'Creating scannable content with lists and tables',
      'Avoiding ambiguity and improving precision'
    ]
  },
  {
    category: 'Technical Implementation',
    title: 'Technical SEO Best Practices for AI Model Crawling and Indexing',
    focusKeywords: ['technical SEO', 'crawlability', 'robots.txt', 'sitemap', 'AI crawlers'],
    targetQuestions: [
      'How do AI crawlers work?',
      'What is robots.txt for AI crawlers?',
      'How do I optimize my sitemap for AI?',
      'What technical factors affect AI visibility?'
    ],
    subtopics: [
      'Configuring robots.txt for AI crawlers (GPTBot, Claude-Web, etc.)',
      'XML sitemap optimization',
      'Page speed and performance impact',
      'Mobile responsiveness and accessibility',
      'Managing crawl budget for AI bots'
    ]
  },
  {
    category: 'Semantic SEO',
    title: 'Semantic SEO: Optimizing for Meaning and Context in AI Search',
    focusKeywords: ['semantic SEO', 'entity optimization', 'topical authority', 'knowledge graphs'],
    targetQuestions: [
      'What is semantic SEO?',
      'How do AI models understand context?',
      'What are entities in SEO?',
      'How do I build topical authority?'
    ],
    subtopics: [
      'Understanding semantic search and NLP',
      'Entity recognition and optimization',
      'Building comprehensive topic clusters',
      'Internal linking for semantic relationships',
      'Creating knowledge graph-friendly content'
    ]
  },
  {
    category: 'Authority and Trust',
    title: 'Building Authority and Trust Signals That AI Models Recognize',
    focusKeywords: ['E-E-A-T', 'authority signals', 'trust signals', 'credibility', 'citations'],
    targetQuestions: [
      'What authority signals do AI models look for?',
      'How do I demonstrate expertise to AI?',
      'What are trust signals for AI models?',
      'How important are backlinks for AI visibility?'
    ],
    subtopics: [
      'E-E-A-T principles for AI optimization',
      'Author credentials and expertise markers',
      'Citation and reference best practices',
      'Building a strong backlink profile',
      'Social proof and reputation management'
    ]
  },
  {
    category: 'Question Answering',
    title: 'Optimizing Your Website for AI-Powered Question Answering',
    focusKeywords: ['QA optimization', 'FAQ schema', 'question answering', 'featured snippets'],
    targetQuestions: [
      'How do AI models answer questions?',
      'What is QA optimization?',
      'Should I use FAQ schema?',
      'How do I structure Q&A content?'
    ],
    subtopics: [
      'Understanding AI question-answering systems',
      'Implementing FAQ and QA schema markup',
      'Structuring content in Q&A format',
      'Writing clear, complete answers',
      'Optimizing for conversational queries'
    ]
  },
  {
    category: 'Content Structure',
    title: 'Document Structure Best Practices for Maximum AI Discoverability',
    focusKeywords: ['document structure', 'HTML semantics', 'content hierarchy', 'heading structure'],
    targetQuestions: [
      'How should I structure my web pages?',
      'What HTML elements matter for AI?',
      'How do I use headings correctly?',
      'What is semantic HTML?'
    ],
    subtopics: [
      'Proper HTML5 semantic elements',
      'Heading hierarchy and organization',
      'ARIA labels and accessibility',
      'Main content identification',
      'Navigation and site structure'
    ]
  },
  {
    category: 'Metadata Optimization',
    title: 'Meta Tags and Metadata That AI Models Actually Use',
    focusKeywords: ['meta tags', 'metadata', 'title tags', 'meta descriptions', 'Open Graph'],
    targetQuestions: [
      'Which meta tags do AI models use?',
      'How do I write good meta descriptions for AI?',
      'Do title tags matter for AI visibility?',
      'What is Open Graph metadata?'
    ],
    subtopics: [
      'Essential meta tags for AI models',
      'Writing effective title tags',
      'Meta descriptions that AI understands',
      'Open Graph and Twitter Card optimization',
      'Canonical tags and duplicate content'
    ]
  },
  {
    category: 'Local SEO for AI',
    title: 'Local Business Optimization for AI-Powered Local Search',
    focusKeywords: ['local SEO', 'local business schema', 'NAP consistency', 'local AI search'],
    targetQuestions: [
      'How do AI models handle local search?',
      'What is local business schema?',
      'How do I optimize for local AI queries?',
      'What local signals matter for AI?'
    ],
    subtopics: [
      'LocalBusiness schema implementation',
      'NAP consistency across the web',
      'Google Business Profile optimization',
      'Local content and geo-targeting',
      'Reviews and local reputation'
    ]
  },
  {
    category: 'E-commerce Optimization',
    title: 'Product Schema and E-commerce Optimization for AI Shopping Assistants',
    focusKeywords: ['product schema', 'e-commerce SEO', 'product optimization', 'shopping AI'],
    targetQuestions: [
      'How do I optimize products for AI?',
      'What is product schema markup?',
      'How do AI shopping assistants work?',
      'What product data should I include?'
    ],
    subtopics: [
      'Product schema markup essentials',
      'Rich product descriptions for AI',
      'Price, availability, and review data',
      'Product categorization and attributes',
      'Image optimization for product discovery'
    ]
  },
  {
    category: 'Content Freshness',
    title: 'Content Freshness and Update Strategies for AI Model Indexing',
    focusKeywords: ['content freshness', 'content updates', 'lastmod', 'temporal relevance'],
    targetQuestions: [
      'How often should I update content?',
      'Do AI models prefer fresh content?',
      'How do I signal content updates?',
      'What is temporal relevance?'
    ],
    subtopics: [
      'Importance of content freshness for AI',
      'Using lastmod in sitemaps effectively',
      'Content update strategies',
      'Maintaining evergreen vs. timely content',
      'Signaling content revision dates'
    ]
  },
  {
    category: 'Multimedia Optimization',
    title: 'Image and Video Optimization for AI Model Understanding',
    focusKeywords: ['image SEO', 'alt text', 'video optimization', 'multimedia accessibility'],
    targetQuestions: [
      'How do AI models understand images?',
      'What is good alt text?',
      'Should I optimize videos for AI?',
      'How do I make multimedia accessible?'
    ],
    subtopics: [
      'Writing descriptive alt text',
      'Image file naming conventions',
      'Video transcripts and captions',
      'ImageObject and VideoObject schema',
      'Multimedia sitemaps'
    ]
  },
  {
    category: 'International SEO',
    title: 'International and Multilingual SEO for Global AI Visibility',
    focusKeywords: ['international SEO', 'hreflang', 'multilingual content', 'global optimization'],
    targetQuestions: [
      'How do I optimize for multiple languages?',
      'What is hreflang?',
      'How do AI models handle multilingual content?',
      'Should I create separate sites for different countries?'
    ],
    subtopics: [
      'Hreflang implementation guide',
      'URL structure for international sites',
      'Content localization vs. translation',
      'Regional targeting signals',
      'Multilingual schema markup'
    ]
  },
  {
    category: 'Analytics and Measurement',
    title: 'Measuring and Tracking AI Visibility: Metrics That Matter',
    focusKeywords: ['AI analytics', 'visibility metrics', 'AI traffic tracking', 'performance measurement'],
    targetQuestions: [
      'How do I measure AI visibility?',
      'What metrics should I track?',
      'How do I track AI referral traffic?',
      'What tools measure AI performance?'
    ],
    subtopics: [
      'Key AI visibility metrics',
      'Tracking AI bot crawls in logs',
      'Measuring citation and mention rates',
      'Attribution for AI-driven traffic',
      'Benchmarking AI visibility performance'
    ]
  },
  {
    category: 'Common Mistakes',
    title: '15 Critical AI Visibility Mistakes That Are Hurting Your Website',
    focusKeywords: ['AI visibility mistakes', 'SEO errors', 'common pitfalls', 'optimization errors'],
    targetQuestions: [
      'What mistakes hurt AI visibility?',
      'What should I avoid for AI optimization?',
      'Why is my content not being cited?',
      'How do I fix AI visibility issues?'
    ],
    subtopics: [
      'Blocking AI crawlers accidentally',
      'Poor content structure',
      'Missing or incorrect schema markup',
      'Thin or duplicate content',
      'Technical barriers to crawling'
    ]
  },
  {
    category: 'Case Studies',
    title: 'Real-World Case Studies: Websites That Improved AI Visibility by 300%',
    focusKeywords: ['AI visibility case study', 'optimization results', 'success stories', 'before and after'],
    targetQuestions: [
      'What results can I expect from AI optimization?',
      'Are there examples of successful AI visibility?',
      'How long does AI optimization take?',
      'What tactics work best?'
    ],
    subtopics: [
      'E-commerce site optimization success',
      'SaaS company AI visibility growth',
      'Content publisher transformation',
      'Local business AI discovery',
      'Key tactics that drove results'
    ]
  },
  {
    category: 'AI Crawler Management',
    title: 'Complete Guide to AI Crawler Management and Robots.txt Configuration',
    focusKeywords: ['AI crawlers', 'GPTBot', 'Claude-Web', 'crawler management', 'robots.txt'],
    targetQuestions: [
      'What AI crawlers exist?',
      'How do I allow AI crawlers?',
      'Should I block any AI bots?',
      'How do I configure robots.txt for AI?'
    ],
    subtopics: [
      'Directory of major AI crawlers',
      'Robots.txt syntax for AI bots',
      'Selective blocking strategies',
      'Rate limiting considerations',
      'Monitoring crawler behavior'
    ]
  },
  {
    category: 'Link Building',
    title: 'Link Building Strategies That Improve AI Model Citations',
    focusKeywords: ['link building', 'backlinks', 'authority building', 'citation building'],
    targetQuestions: [
      'Do backlinks matter for AI visibility?',
      'How do I build authoritative links?',
      'What link building strategies work for AI?',
      'How do citations relate to links?'
    ],
    subtopics: [
      'Quality vs. quantity in link building',
      'Digital PR and authority sites',
      'Content partnerships and collaborations',
      'Guest posting best practices',
      'Natural link acquisition tactics'
    ]
  },
  {
    category: 'Voice Search',
    title: 'Optimizing for Voice Search and Conversational AI Queries',
    focusKeywords: ['voice search', 'conversational AI', 'natural language', 'voice optimization'],
    targetQuestions: [
      'How do I optimize for voice search?',
      'What is conversational AI?',
      'How do voice queries differ from text?',
      'What content works for voice search?'
    ],
    subtopics: [
      'Understanding voice search behavior',
      'Long-tail conversational keywords',
      'Featured snippet optimization',
      'Local voice search optimization',
      'Natural language content structure'
    ]
  }
];

const MASTER_PROMPT_TEMPLATE = `You are an expert technical writer for AIVO Insights, a leading authority on AI visibility optimization. Your task is to write a comprehensive, authoritative HTML article that will be indexed and cited by AI models like ChatGPT, Claude, Gemini, and others.

CRITICAL REQUIREMENTS FOR AI MODEL OPTIMIZATION:

1. **Length**: Minimum 2500 words of substantive content
2. **Structure**: Output valid semantic HTML with <h2>, <h3>, <p>, <ul>, <ol>, and <table> elements and descriptive headings
3. **Clarity**: Write definitively - avoid hedging language
4. **Scannability**: Use lists, tables, and clear formatting
5. **Answering Questions**: Directly answer common questions that users ask AI models
6. **Authority**: Cite specific techniques, tools, and data when applicable
7. **Actionability**: Provide concrete, implementable steps
8. **Comprehensiveness**: Cover the topic exhaustively

CONTENT STRUCTURE (MANDATORY):

1. **Introduction (200-300 words)**
   - Hook with a relevant statistic or pain point
   - Clear definition of the topic
   - Preview of what readers will learn
   - Why this matters for AI visibility

2. **Core Content Sections (2000+ words)**
   - Multiple H2 sections covering different aspects
   - Each section should have H3 subsections
   - Use bullet points, numbered lists, and tables
   - Include specific examples and techniques
   - Address common questions directly

3. **Practical Implementation (300-400 words)**
   - Step-by-step action plan
   - Tools and resources needed
   - Common pitfalls to avoid
   - Expected timeline and results

4. **Key Takeaways Section**
   - 5-7 bullet points summarizing main points
   - Make these citation-worthy statements

5. **FAQ Section (Optional but Recommended)**
   - 3-5 common questions with direct answers
   - Use clear Q&A format

WRITING STYLE:

-- **Tone**: Professional, authoritative, technical yet accessible
- **Voice**: Second person ("you") for actionability
- **Sentences**: Vary length but keep average under 25 words
- **Paragraphs**: 2-4 sentences each for scannability
- **Definitions**: Define technical terms clearly on first use
- **Examples**: Use specific, concrete examples
- **Data**: Include statistics, percentages, and measurable outcomes

VISUAL POLISH AND EMOJIS:

- Use a few well-chosen, professional-feeling emojis in major section headings and key callout bullets (for example: 🚀, 📊, 🧠, 🛠️, ✅, 📌).
- Place emojis at the start of headings or bullets, not in the middle of sentences.
- Do not overuse emojis: most H2/H3 headings should have at most one emoji, and many regular paragraphs should have none.

OPTIMIZATION FOR AI CITATIONS:

1. **Direct Answers**: Start key paragraphs with clear, quotable statements
2. **Question Headers**: Use question-based H2/H3 headers when appropriate
3. **Definitive Language**: Avoid "might," "could," "possibly" - be authoritative
4. **Lists and Tables**: AI models love structured data
5. **Context**: Provide enough context for statements to stand alone
6. **Unique Insights**: Include original perspectives and frameworks
7. **Temporal References**: Use "in 2025" or "as of 2025" for currency

CONTENT AUTHENTICITY:

- Write original content, not generic advice
- Include specific techniques and methodologies
- Reference real tools, platforms, and technologies
- Provide actionable technical details
- Make bold, supportable claims

TOPIC: {topic_title}

CATEGORY: {category}

FOCUS KEYWORDS: {focus_keywords}

TARGET QUESTIONS TO ANSWER:
{target_questions}

REQUIRED SUBTOPICS TO COVER:
{subtopics}

Now write a comprehensive, authoritative HTML blog post (do NOT return Markdown) that will become a go-to resource for AI models when users ask about this topic. Make every word count toward being the definitive source that AI models will cite.`;

function generatePromptForTopic(topic: BlogTopic): string {
  return MASTER_PROMPT_TEMPLATE
    .replace('{topic_title}', topic.title)
    .replace('{category}', topic.category)
    .replace('{focus_keywords}', topic.focusKeywords.join(', '))
    .replace('{target_questions}', topic.targetQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n'))
    .replace('{subtopics}', topic.subtopics.map((s, i) => `${i + 1}. ${s}`).join('\n'));
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function fetchCoverImage(topic: BlogTopic, supabase: SupabaseClient): Promise<CoverImageResult | null> {
  const pexelsKey =
    Deno.env.get("PEXELS_API_KEY") ??
    Deno.env.get("VITE_PEXELS_API_KEY") ??
    null;
  if (!pexelsKey) {
    return null;
  }

  // Get list of already used image URLs
  const { data: usedImages } = await supabase
    .from('used_blog_images')
    .select('image_url');

  const usedUrls = new Set((usedImages ?? []).map(img => img.image_url));

  const queries = [
    topic.title,
    `${topic.category} illustration`,
    ...topic.focusKeywords,
  ].filter(Boolean);

  // Try multiple search queries to find a unique image
  for (const searchQuery of queries) {
    const url = `${PEXELS_API_URL}?query=${encodeURIComponent(searchQuery)}&orientation=landscape&size=large&per_page=40`;

    const response = await fetch(url, {
      headers: {
        Authorization: pexelsKey,
      },
    });

    if (!response.ok) {
      console.warn("Failed to fetch Pexels image", await response.text());
      continue;
    }

    const data = await response.json() as { photos?: PexelsPhoto[] };
    const photos = data.photos ?? [];
    if (!photos.length) {
      continue;
    }

    // Filter out already used images
    const unusedPhotos = photos.filter((photo) => {
      const imageUrl = photo.src?.large2x ?? photo.src?.large ?? photo.src?.original;
      return !usedUrls.has(imageUrl);
    });

    if (unusedPhotos.length > 0) {
      const chosen = unusedPhotos[Math.floor(Math.random() * unusedPhotos.length)];
      const imageUrl = chosen.src?.large2x ?? chosen.src?.large ?? chosen.src?.original;

      // Mark this image as used
      await supabase
        .from('used_blog_images')
        .insert({
          image_url: imageUrl,
          photographer: chosen.photographer,
          photographer_url: chosen.photographer_url,
        });

      return {
        url: imageUrl,
        author: chosen.photographer,
        authorUrl: chosen.photographer_url,
        source: "Pexels",
      };
    }
  }

  // If all images from all queries have been used, fall back to fallback image
  return null;
}

async function ensureCoverImage(topic: BlogTopic, supabase: SupabaseClient): Promise<CoverImageResult> {
  const cover = await fetchCoverImage(topic, supabase);
  if (cover) return cover;

  return {
    url: FALLBACK_COVER_IMAGE_URL,
    author: "AIVO Insights",
    source: "AIVO",
  };
}

function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function estimateReadingTime(html: string): number {
  const words = stripHtml(html).split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function ensureHtml(content: string): string {
  const trimmed = content?.trim() || '';
  if (!trimmed) return '';

  const looksLikeHtml = /<\s*(article|section|div|p|h[1-6])/i.test(trimmed);
  if (looksLikeHtml) {
    return trimmed;
  }

  marked.setOptions({
    gfm: true,
    breaks: true,
    mangle: false,
    headerIds: false,
  });

  return marked.parse(trimmed);
}

async function getLatestPostAndCleanupDuplicates(
  supabase: SupabaseClient,
  title: string,
): Promise<{ latestPost: StoredBlogPost | null; removed: number }> {
  const { data: existingPosts, error: existingError }: { data: StoredBlogPost[] | null; error: unknown } = await supabase
    .from('blog_posts')
    .select('id, published_at, created_at')
    .eq('title', title)
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (existingError) throw existingError;
  if (!existingPosts?.length) return { latestPost: null, removed: 0 };

  const [latest, ...duplicates] = existingPosts;
  let removed = 0;

  if (duplicates.length) {
    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .in('id', duplicates.map((p) => p.id));

    if (deleteError) throw deleteError;
    removed = duplicates.length;
  }

  const { data: latestPost, error: latestError }: { data: StoredBlogPost | null; error: unknown } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', latest.id)
    .single();

  if (latestError) throw latestError;
  return { latestPost, removed };
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} environment variable is not configured`);
  }
  return value;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = requireEnv("SUPABASE_URL");
    const supabaseServiceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const deepseekApiKey = requireEnv("DEEPSEEK_API_KEY");
    const deepseekBaseUrl = (Deno.env.get("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com/v1").replace(/\/$/, "");
    const deepseekModel = Deno.env.get("DEEPSEEK_MODEL") ?? "deepseek-chat";
    const deepseekApiUrl = `${deepseekBaseUrl}/chat/completions`;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    if (adminEmails.length > 0) {
      const email = user.email?.toLowerCase();
      if (!email || !adminEmails.includes(email)) {
        throw new Error("Only administrators can generate blog posts");
      }
    }

    // Get or create state row
    const { data: stateRow, error: stateError } = await supabase
      .from('blog_generation_state')
      .select('*')
      .maybeSingle();

    if (stateError) throw stateError;

    // If no state exists, create it
    let stateData = stateRow;
    if (!stateData) {
      const { data: newState, error: insertStateError } = await supabase
        .from('blog_generation_state')
        .insert({
          last_topic_index: -1,
          total_generated: 0,
        })
        .select()
        .single();

      if (insertStateError) throw insertStateError;
      stateData = newState;
    }

    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // ATOMIC CHECK AND UPDATE: Try to claim today's generation slot
    // This prevents race conditions when multiple requests come in simultaneously
    const { data: updatedState, error: updateStateError } = await supabase
      .from('blog_generation_state')
      .update({
        last_generated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', stateData.id)
      // Only update if last_generated_at is NOT today (this is the atomic check)
      .not('last_generated_at', 'gte', todayDateString)
      .select()
      .maybeSingle();

    if (updateStateError) throw updateStateError;

    // If update returned null, someone else already claimed today's slot
    if (!updatedState) {
      // Return the latest published post from today
      const { data: latestToday, error: latestTodayError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .gte('published_at', todayDateString)
        .order('published_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestTodayError) throw latestTodayError;

      return new Response(
        JSON.stringify({
          success: true,
          post: latestToday,
          topic: latestToday?.title,
          reused: true,
          message: 'Blog post already generated today',
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // We successfully claimed the slot! Now generate the post
    const currentIndex = stateData.last_topic_index ?? 0;
    const nextIndex = (currentIndex + 1) % BLOG_TOPICS.length;
    const topic = BLOG_TOPICS[nextIndex];

    // Clean up any duplicates of this title from previous runs
    const { removed: removedDuplicates } = await getLatestPostAndCleanupDuplicates(
      supabase,
      topic.title,
    );

    if (removedDuplicates > 0) {
      console.log(`Cleaned up ${removedDuplicates} duplicate posts for topic: ${topic.title}`);
    }

    const prompt = generatePromptForTopic(topic);

    const deepseekResponse = await fetch(deepseekApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: deepseekModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!deepseekResponse.ok) {
      const errorText = await deepseekResponse.text();
      throw new Error(`DeepSeek API error: ${deepseekResponse.status} - ${errorText}`);
    }

    const deepseekData = await deepseekResponse.json();
    const rawContent = deepseekData.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error('No content generated from DeepSeek API');
    }

    const content = ensureHtml(rawContent);

    // Add timestamp to slug to ensure uniqueness
    const baseSlug = generateSlug(topic.title);
    const timestamp = Date.now();
    const slug = `${baseSlug}-${timestamp}`;
    const excerpt = stripHtml(content).substring(0, 220).trim() + '...';
    const readingTime = estimateReadingTime(content);
    const coverImage = await ensureCoverImage(topic, supabase);

    const { data: postData, error: postError } = await supabase
      .from('blog_posts')
      .insert({
        title: topic.title,
        slug,
        content,
        content_format: 'html',
        excerpt,
        meta_description: excerpt,
        author_name: 'AIVO Insights',
        tags: topic.focusKeywords,
        published: true,
        published_at: new Date().toISOString(),
        reading_time_minutes: readingTime,
        cover_image_url: coverImage?.url,
        image_author: coverImage?.author,
        image_author_url: coverImage?.authorUrl,
        image_source: coverImage?.source ?? (coverImage ? 'Pexels' : null),
      })
      .select()
      .single();

    if (postError) throw postError;

    // Update the topic index and increment total count
    // (last_generated_at was already set atomically at the start)
    const { error: updateError } = await supabase
      .from('blog_generation_state')
      .update({
        last_topic_index: nextIndex,
        total_generated: (stateData.total_generated || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stateData.id);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        post: postData,
        topic: topic.title,
        category: topic.category,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error generating blog:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
