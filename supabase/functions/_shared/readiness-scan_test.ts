import { assert, assertEquals } from 'jsr:@std/assert@1';
import { assessReadiness, extractPage, hasEvidence } from './readiness-scan.ts';
import { fetchWithTimeout } from './fetch.ts';
import type { DiscoveredSite, FetchedResource } from './analysis-types.ts';

function resource(body: string, extra = {}): FetchedResource { return { url: 'https://example.com/', status: 200, bytes: body.length, body, contentType: 'text/html', ...extra }; }
const html = '<html><head><title>Lighting design</title><meta content="Architectural lighting design" name="description"><script type="application/ld+json">{"@type":["Organization","LocalBusiness"]}</script></head><body><main><h1>Lighting for buildings</h1><h2>Services</h2><p>Our lighting designers create interior and exterior lighting plans for commercial buildings. We collaborate with architects on projects in Dallas and New York.</p><p>Contact the team to discuss your design requirements and project timeline.</p></main></body></html>';
function site(body = html): DiscoveredSite {
  const page = resource(body);
  return { input_url: page.url, normalized_url: page.url, domain: 'example.com', homepage: page, pages: [page], system_files: [], sitemap_urls: [], detected_pages: { about:[],contact:[],trust:[],faq:[],product_or_service:[] }, evidence: { discovered_pages:[page.url],fetched_pages:[{ url:page.url,bytes:page.bytes,status:200 }],failed_pages:[],system_files:[],crawl_warnings:[] } };
}

Deno.test('large style blocks do not hide visible content; metadata order and array schema types parse', () => {
  const page = extractPage(resource(html.replace('</head>', '<style>'+'x'.repeat(160000)+'</style></head>')));
  assert(page.text.includes('Our lighting designers'));
  assert(!page.text.includes('xxxxx'));
  assertEquals(page.description, 'Architectural lighting design');
  assertEquals(page.schema_types, ['Organization','LocalBusiness']);
});

Deno.test('invented quotes, wrong URLs and truncated page evidence are rejected', () => {
  const page = extractPage(resource(html));
  assert(hasEvidence({ page_url:page.url,evidence_excerpt:'Our lighting designers create interior and exterior lighting plans' },[page]));
  assert(!hasEvidence({ page_url:page.url,evidence_excerpt:'We have ten million satisfied clients' },[page]));
  assert(!hasEvidence({ page_url:'https://other.example/',evidence_excerpt:page.text },[page]));
  assert(!hasEvidence({ page_url:page.url,evidence_excerpt:page.text },[{...page,truncated:true}]));
});

Deno.test('Luna request uses bounded reasoning tokens and evidence validated scores without FAQ ceiling', async () => {
  const original = globalThis.fetch; const oldKey = Deno.env.get('OPENAI_API_KEY');
  Deno.env.set('OPENAI_API_KEY','test-only-placeholder');
  try {
    globalThis.fetch = ((_url, init) => {
      const request = JSON.parse(String((init as {body?: string})?.body));
      assertEquals(request.model,'gpt-6-luna');
      assertEquals(request.reasoning_effort,'low');
      assertEquals(request.response_format.json_schema.strict,true);
      assert(!('temperature' in request)); assert(!('max_tokens' in request));
      const data = { summary:'Clear architectural lighting services.', assessments:['content_clarity','qa_readiness','authority_trust'].map(category => ({ category,score:82,page_url:'https://example.com/',evidence_excerpt:'Our lighting designers create interior and exterior lighting plans',reason:'The service offering is visible.',fix:'Include project examples relevant to this service.' })), recommendations:[{category:'semantic_structure',severity:'medium',title:'Use one main heading',page_url:'https://example.com/',evidence_excerpt:'Our lighting designers create interior and exterior lighting plans',exact_fix:'Retain one H1 and change the duplicate to H2.'}] };
      return Promise.resolve(Response.json({ model:'gpt-6-luna',choices:[{ finish_reason:'stop',message:{ content:JSON.stringify(data) } }],usage:{prompt_tokens:1000,completion_tokens:300} }));
    }) as typeof fetch;
    const result = await assessReadiness(site(html.replace('<h2>Services</h2>','<h1>Services</h1>')));
    assertEquals(result.v2_evidence.model,'gpt-6-luna');
    assertEquals(result.analysis_json.category_scores.qa_readiness,82);
    assertEquals(result.overall_score,Math.round(Object.values(result.analysis_json.category_scores).reduce((a,b)=>a+b,0)/6));
    assert(!result.analysis_json.recommendations.some(r=>r.id==='schema'));
    assertEquals(result.analysis_json.recommendations.filter(r=>/heading/i.test(r.title)).length,1);
    assertEquals(result.v2_evidence.query_battery,[]);
  } finally { globalThis.fetch=original; if (oldKey===undefined) Deno.env.delete('OPENAI_API_KEY'); else Deno.env.set('OPENAI_API_KEY',oldKey); }
});

Deno.test('provider failures leave unmeasured categories null and disclose partial coverage', async () => {
  const original=globalThis.fetch; const oldKey=Deno.env.get('OPENAI_API_KEY'); Deno.env.set('OPENAI_API_KEY','test-only-placeholder');
  try {
    globalThis.fetch=(()=>Promise.resolve(Response.json({error:'unavailable'},{status:503}))) as typeof fetch;
    const result=await assessReadiness(site());
    assertEquals((result.v2_score as Record<string,unknown>).content_clarity,null);
    assertEquals(result.v2_evidence.analysis_status,'partial');
    assertEquals(result.v2_evidence.model_completed,false);
    assert(result.analysis_json.warnings.some(w=>w.includes('503')));
  } finally { globalThis.fetch=original; if(oldKey===undefined)Deno.env.delete('OPENAI_API_KEY');else Deno.env.set('OPENAI_API_KEY',oldKey); }
});

Deno.test('body capture reports truncation accurately and rejects unsafe redirects', async () => {
  const original=globalThis.fetch;
  try {
    globalThis.fetch=(()=>Promise.resolve(new Response('123456789'))) as typeof fetch;
    const r=await fetchWithTimeout('https://example.com',{},1000,5);
    assertEquals(await r.text(),'12345'); assertEquals(r.headers.get('x-aivo-truncated'),'true');
    globalThis.fetch=(()=>Promise.resolve(new Response('12345'))) as typeof fetch;
    const exact=await fetchWithTimeout('https://example.com',{},1000,5);
    assertEquals(exact.headers.get('x-aivo-truncated'),'false');
    globalThis.fetch=(()=>Promise.resolve(new Response(null,{status:302,headers:{location:'https://127.0.0.1/'}}))) as typeof fetch;
    let blocked=false; try { await fetchWithTimeout('https://example.com',{},1000,5); } catch { blocked=true; }
    assert(blocked);
  } finally {globalThis.fetch=original;}
});
