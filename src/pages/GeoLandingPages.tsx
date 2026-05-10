import { CheckCircle2, FileSearch, FileText, Network, SearchCheck, ShieldCheck } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import PublicScanForm from '../components/scan/PublicScanForm';
import SEOHead from '../components/shared/SEOHead';
import { SITE } from '../config/site';

interface FaqItem {
  question: string;
  answer: string;
}

interface LandingContent {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  intro: string;
  primarySections: Array<{
    heading: string;
    body: string;
  }>;
  checklistHeading: string;
  checklist: string[];
  faq: FaqItem[];
}

const iconClasses = 'h-5 w-5 text-blue-700';

function faqSchema(content: LandingContent) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}

function GeoLandingPage({ content }: { content: LandingContent }) {
  const siteUrl = SITE.url.replace(/\/$/, '');
  const canonical = `${siteUrl}/${content.slug}`;

  return (
    <MarketingLayout>
      <SEOHead
        title={content.metaTitle}
        description={content.metaDescription}
        canonical={canonical}
        ogTitle={content.metaTitle}
        ogDescription={content.metaDescription}
        ogImage={`${siteUrl}/og-image.png`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(content)) }} />

      <article>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase text-blue-200">{content.eyebrow}</p>
              <h1 className="mt-4 text-4xl font-bold sm:text-5xl">{content.title}</h1>
              <p className="mt-5 text-lg text-slate-200">{content.intro}</p>
            </div>
            <div className="mt-10">
              <PublicScanForm />
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
            {content.primarySections.map((section, index) => {
              const Icon = [SearchCheck, Network, FileText, ShieldCheck][index % 4];
              return (
                <section key={section.heading} className="rounded-lg border border-gray-200 p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Icon className={iconClasses} />
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-950">{section.heading}</h2>
                  <p className="mt-3 leading-7 text-gray-700">{section.body}</p>
                </section>
              );
            })}
          </div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
                <FileSearch className="h-5 w-5 text-emerald-700" />
              </div>
              <h2 className="text-3xl font-bold text-gray-950">{content.checklistHeading}</h2>
              <p className="mt-4 leading-7 text-gray-700">
                AIVO reports are built from detected crawl evidence, not generic advice. The scanner maps each issue to the page,
                file, metadata field, or structured-data signal that triggered the finding, then converts that evidence into a
                prioritized action list your team can use immediately.
              </p>
            </div>
            <ul className="grid gap-3">
              {content.checklist.map((item) => (
                <li key={item} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-4 text-gray-800">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-950">FAQ</h2>
            <div className="mt-8 space-y-4">
              {content.faq.map((item) => (
                <section key={item.question} className="rounded-lg border border-gray-200 p-5">
                  <h3 className="text-lg font-semibold text-gray-950">{item.question}</h3>
                  <p className="mt-2 leading-7 text-gray-700">{item.answer}</p>
                </section>
              ))}
            </div>
          </div>
        </section>
      </article>
    </MarketingLayout>
  );
}

const freeChecker: LandingContent = {
  slug: 'free-ai-visibility-checker',
  title: 'Free AI Visibility Checker',
  metaTitle: 'Free AI Visibility Checker | AIVO Insights',
  metaDescription: 'Run a free AI visibility scan that checks crawl access, entity clarity, answer readiness, trust evidence, and citation readiness.',
  eyebrow: 'Free website scan',
  intro: 'Check whether AI answer engines can crawl, understand, and confidently cite your website. AIVO is free while we build the public AI visibility benchmark.',
  primarySections: [
    {
      heading: 'What the checker evaluates',
      body: 'AIVO starts with the same fundamentals that influence whether a website can appear in an AI-generated answer: crawl access, clean metadata, structured content, and clear evidence about the organization behind the page. The scan fetches your homepage, robots.txt, llms.txt, sitemap.xml, and a small set of important internal pages. It then checks whether AI crawlers are blocked, whether the site exposes a valid sitemap, whether titles and descriptions are present, whether canonical tags are consistent, whether JSON-LD or schema.org markup is detectable, and whether the visible page content gives answer engines enough context to describe the brand accurately. The result is a practical report for marketers, founders, and developers who need to know what to fix first.',
    },
    {
      heading: 'Why AI visibility needs a different lens',
      body: 'Traditional SEO audits often focus on keyword placement, backlinks, and search result snippets. Those signals still matter, but AI answer engines also need evidence they can summarize without guessing. A service page that ranks in search can still be weak for AI if the entity is unclear, the product category is buried, the page depends on client-side rendering, or the site lacks trust markers such as case studies, policies, author information, and citations. AIVO looks for those gaps directly. It does not promise placement inside any specific assistant. It highlights the technical and content conditions that make your site easier to retrieve, interpret, and cite.',
    },
    {
      heading: 'How to use the report',
      body: 'Treat the score as a triage tool, not a vanity metric. A low crawl access score means the first fix belongs to engineering because answer engines may not be able to fetch the right pages. A weak entity clarity score usually means the homepage and core landing pages should state the business, audience, location, services, and differentiators more explicitly. Low answer readiness points to thin explanations, missing FAQ coverage, weak headings, or a lack of direct answers to buyer questions. Trust evidence reflects whether the site gives AI systems verifiable support for claims. Each recommendation should map back to a detected issue, so the work can be assigned with confidence.',
    },
    {
      heading: 'Who benefits most',
      body: 'The free checker is useful for teams that depend on organic discovery but are seeing search behavior shift into AI-assisted research. Local service businesses can verify that location, service area, reviews, and contact information are visible. SaaS teams can test whether product positioning, integrations, security claims, and comparison pages are clear. Ecommerce teams can find product schema and policy gaps. Agencies can use the report as a fast pre-audit before deeper content strategy work. Developers can extract a concise checklist covering robots directives, sitemap validity, metadata, schema, rendering risk, and page evidence.',
    },
  ],
  checklistHeading: 'What to review first',
  checklist: [
    'Crawler permissions for GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, and Google-Extended.',
    'Homepage and priority page metadata, including title, description, canonical, OpenGraph, and Twitter fields.',
    'Schema.org coverage for the actual business type, product category, FAQs, articles, services, and trust evidence.',
    'Answer-ready content that states who you serve, what you offer, proof points, limitations, and next steps.',
    'Evidence gaps that reduce citation likelihood, such as unsupported claims, missing policies, or weak contact details.',
  ],
  faq: [
    {
      question: 'Is the AI visibility checker free?',
      answer: 'Yes. AIVO Insights is free while we build the public AI visibility benchmark. You can run a public scan and review the report without a payment step.',
    },
    {
      question: 'Does this check live rankings inside AI assistants?',
      answer: 'No. AIVO does not claim to measure live placement inside a specific assistant. It evaluates crawlability, structure, metadata, evidence, and answer readiness that influence how AI systems can understand a site.',
    },
    {
      question: 'What should I fix first after a scan?',
      answer: 'Start with critical crawl access issues, invalid or missing sitemap data, missing title and description fields, unclear business identity, and recommendations marked high severity with low effort.',
    },
  ],
};

const chatgptChecker: LandingContent = {
  slug: 'chatgpt-seo-checker',
  title: 'ChatGPT SEO Checker for Answer-Ready Websites',
  metaTitle: 'ChatGPT SEO Checker | AIVO Insights',
  metaDescription: 'Audit whether your website gives AI answer engines the crawl access, structured context, and evidence needed for accurate summaries and citations.',
  eyebrow: 'AI answer readiness',
  intro: 'Run a free scan to see whether your pages are structured for AI-assisted search behavior, including direct answers, entity clarity, schema, and citation evidence.',
  primarySections: [
    {
      heading: 'What ChatGPT-style discovery changes',
      body: 'People increasingly ask assistants direct questions instead of clicking through a list of search results. That changes the job of a website. The page still needs to rank and convert, but it also needs to be easy for an answer engine to parse, summarize, and attribute. AIVO checks the public signals that support that behavior. It looks at whether crawlers can reach your site, whether the homepage declares the entity clearly, whether headings create a logical outline, whether structured data removes ambiguity, and whether the page contains direct answers to common buyer questions. The goal is not to chase a secret ranking factor. The goal is to make the public evidence on your site clear enough to be used accurately.',
    },
    {
      heading: 'Where standard SEO checks stop short',
      body: 'A conventional SEO tool can tell you about keywords, backlinks, page speed, or indexation. Those checks are useful, but they do not always explain whether an AI-generated response can identify the business category, describe the offer, distinguish the company from competitors, or cite the right page. A page can have a strong title tag and still fail an answer-readiness test because the first screen is vague, the pricing or service model is unclear, the trust evidence is hidden, or the content never answers the question a prospect would ask. AIVO adds that layer by combining deterministic technical checks with AI analysis that is constrained to evidence from the crawl.',
    },
    {
      heading: 'How AIVO frames answer readiness',
      body: 'The report separates crawl access from interpretation. Crawl access covers robots directives, sitemap validity, redirects, timeouts, and rendering risk. Entity clarity covers whether the site states its name, category, audience, geography, and value proposition. Answer readiness checks whether pages include concise explanations, comparison context, FAQs, limitations, and next steps. Citation likelihood looks for source-worthy pages, policies, proof points, structured data, and stable URLs that an answer engine could reference. Trust evidence focuses on contact details, authorship, reviews, testimonials, security claims, and policies. This makes the output easier to assign across engineering, content, and marketing.',
    },
    {
      heading: 'What the scan does not claim',
      body: 'This page is named for the way many teams describe AI search optimization, but AIVO is not a live ChatGPT rank tracker and does not claim to inspect private assistant sessions. The public scan checks your website from the outside and reports whether the evidence is strong enough for AI systems to understand. That distinction matters because it keeps the recommendations grounded. If FAQ schema is present, AIVO should not tell you to add FAQ schema. If schema exists but the business type is incomplete, the report should name the missing type. If citations are weak, the report should identify the page or section where supporting evidence belongs.',
    },
  ],
  checklistHeading: 'Signals that improve answer readiness',
  checklist: [
    'Clear first-screen explanation of what the company does, who it serves, and why it is credible.',
    'FAQ, comparison, product, service, and policy content that answers real buyer questions directly.',
    'Structured data that reflects the actual page purpose instead of generic site-wide markup only.',
    'Stable URLs for source-worthy content such as guides, case studies, documentation, and policies.',
    'Trust details that support claims, including authorship, contact paths, security context, and customer proof.',
  ],
  faq: [
    {
      question: 'Is this a ChatGPT rank tracker?',
      answer: 'No. AIVO checks the public website evidence that supports AI answer readiness. It does not claim to measure live placement in private assistant conversations.',
    },
    {
      question: 'Can this replace SEO tools?',
      answer: 'No. It complements SEO tools by focusing on crawl access, entity clarity, structured context, and answer evidence that are often missing from keyword-first reports.',
    },
    {
      question: 'Why do recommendations mention evidence?',
      answer: 'Evidence keeps the report actionable. Every recommendation should trace back to a detected page, metadata field, schema gap, crawl finding, or answer-readiness issue.',
    },
  ],
};

const citationChecker: LandingContent = {
  slug: 'ai-citation-checker',
  title: 'AI Citation Checker for Source-Worthy Pages',
  metaTitle: 'AI Citation Checker | AIVO Insights',
  metaDescription: 'Find the technical, content, and trust gaps that make your website harder for AI answer engines to cite accurately.',
  eyebrow: 'Citation readiness',
  intro: 'See whether your site gives AI systems stable, specific, and trustworthy pages to reference when answering questions about your market.',
  primarySections: [
    {
      heading: 'What citation readiness means',
      body: 'AI citation readiness is the likelihood that a public page contains enough clear, verifiable information to be referenced as a source. It is not only a backlink problem and it is not only a schema problem. A page is more source-worthy when it has a stable URL, a focused topic, visible authorship or organization context, specific claims, supporting proof, clean metadata, and direct answers. AIVO evaluates those ingredients against the crawl evidence it collects. The scanner looks for canonical URLs, title and description quality, OpenGraph and Twitter metadata, schema types, headings, FAQ structure, policy pages, contact details, and trust signals that support the claims on the page.',
    },
    {
      heading: 'Why AI systems avoid weak sources',
      body: 'Answer engines need to avoid overconfident summaries when the source material is vague or unsupported. A service page that says a company is trusted, secure, fast, or best-in-class without proof gives the model little to cite. A product page with missing specifications, unclear availability, or no policy links can also be risky. Local sites often lose citation strength when location, licensing, service area, reviews, and contact details are scattered or hidden. AIVO flags these issues because citation likelihood depends on the quality of evidence, not just the presence of marketing copy. The report turns those gaps into specific fixes that can be assigned to the right owner.',
    },
    {
      heading: 'How to build pages worth citing',
      body: 'Strong citation pages usually answer one intent thoroughly. They define the topic, state the organization behind the content, explain the method or basis for claims, link to supporting pages, and avoid burying important facts behind scripts or interactive UI. For SaaS, that might mean a security page, integration documentation, pricing explanation, customer case study, or comparison guide. For local services, it might mean location pages, service pages, credentials, review summaries, and warranty details. For ecommerce, it might mean product specs, shipping policies, return policies, reviews, and availability. AIVO helps you find which of these assets are missing or hard to read.',
    },
    {
      heading: 'How AIVO keeps the output grounded',
      body: 'Generic advice is easy to produce and hard to act on. AIVO is designed to avoid that by requiring recommendations to cite the evidence that triggered them. If the scan found no llms.txt file, that is a system-file finding. If the sitemap is malformed, that is a crawl finding. If JSON-LD exists but lacks Product or LocalBusiness details, the recommendation should name the missing type. If the answer simulation sees weak trust evidence, it should point to the relevant page context. This structure is especially useful when a marketing team needs a developer checklist and a content brief from the same report.',
    },
  ],
  checklistHeading: 'Citation readiness checks',
  checklist: [
    'Canonical and metadata signals that make source URLs stable and understandable.',
    'Specific proof for claims, including testimonials, case studies, policies, author context, or documentation.',
    'Schema types that match the page purpose, such as Article, Product, Service, LocalBusiness, FAQPage, or Organization.',
    'Clear answer blocks that define the topic, audience, constraints, and next action.',
    'No script-only shell risk that hides important citation evidence from lightweight crawlers.',
  ],
  faq: [
    {
      question: 'Can AIVO guarantee AI citations?',
      answer: 'No. AIVO cannot guarantee citations. It identifies the technical and content conditions that make a page more credible, understandable, and reference-worthy.',
    },
    {
      question: 'What pages are most useful for citation readiness?',
      answer: 'Useful pages include detailed service pages, product pages, documentation, policy pages, case studies, comparison guides, FAQs, and author or company profile pages.',
    },
    {
      question: 'Does schema alone make a page citable?',
      answer: 'No. Schema helps clarify meaning, but citation readiness also depends on visible content, trust evidence, stable URLs, and specific support for claims.',
    },
  ],
};

const llmsTxtChecker: LandingContent = {
  slug: 'llms-txt-checker',
  title: 'llms.txt Checker for AI-Readable Site Guidance',
  metaTitle: 'llms.txt Checker | AIVO Insights',
  metaDescription: 'Check whether your website has llms.txt and whether it gives AI systems useful, accurate guidance about important pages and claims.',
  eyebrow: 'System file audit',
  intro: 'Scan your site for llms.txt, sitemap, robots directives, and page evidence that help AI crawlers understand your most important content.',
  primarySections: [
    {
      heading: 'What llms.txt is for',
      body: 'The llms.txt file is an emerging convention for giving AI systems a concise map of useful website content. It can summarize what the organization does, identify key pages, document important claims and limitations, and point crawlers toward pages that explain products, policies, documentation, and support. AIVO checks whether the file exists and summarizes what it contains. The presence of llms.txt is not a magic ranking lever, and the format is still evolving. Its value comes from reducing ambiguity. When the file accurately reflects the public site, it can help teams make their AI-facing content inventory explicit.',
    },
    {
      heading: 'What makes llms.txt useful',
      body: 'A useful file is short, factual, and aligned with the site. It should name the product or organization, describe the audience, list important pages, clarify what the company does not claim, provide contact information, and link to representative reports, documentation, or policies. It should not contain private information, unsupported superlatives, or instructions that conflict with robots.txt. AIVO treats llms.txt as one part of a broader evidence set. If the file says the company has a security page but no crawlable security page exists, the report should surface the mismatch. If the file is missing, the recommendation should explain what content belongs there.',
    },
    {
      heading: 'How llms.txt relates to robots.txt',
      body: 'Robots.txt controls crawler access; llms.txt provides orientation. They solve different problems. A site can have a perfect llms.txt file while robots.txt blocks important AI crawlers, which means the guidance may not matter. A site can also allow crawlers but provide no clear map of important pages. AIVO checks both. It looks for directives affecting GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, and Google-Extended, then checks llms.txt and sitemap.xml. This combination helps developers distinguish access problems from guidance problems and content problems.',
    },
    {
      heading: 'How to act on the scan',
      body: 'If your report shows no llms.txt file, start by creating a public file at the site root. Keep it accurate and link only to pages you are comfortable having crawled and summarized. If the file exists but is thin, add the pages that explain your product, service, audience, trust evidence, policies, and support. If the file conflicts with page content, fix the content first. The file should summarize reality, not compensate for unclear pages. AIVO also checks whether the rest of the site has the schema, metadata, headings, and answer-ready sections that make the linked pages useful.',
    },
  ],
  checklistHeading: 'A practical llms.txt review',
  checklist: [
    'Presence at the root path with clear product, audience, and contact information.',
    'Links to important public pages such as overview, FAQ, documentation, policies, pricing explanation, or sample reports.',
    'No private data, credentials, unsupported claims, or crawler instructions that conflict with robots.txt.',
    'Alignment with sitemap.xml and the visible content on linked pages.',
    'Maintenance plan so the file changes when products, policies, or core URLs change.',
  ],
  faq: [
    {
      question: 'Do I need llms.txt for AI visibility?',
      answer: 'It is not required, but it can provide a useful orientation file for AI systems and for internal teams managing AI-facing content.',
    },
    {
      question: 'Where should llms.txt live?',
      answer: 'Place it at the root of your site, such as /llms.txt, so crawlers and users can find it consistently.',
    },
    {
      question: 'Should llms.txt include private instructions?',
      answer: 'No. Treat llms.txt as a public file. Include factual summaries and public links only.',
    },
  ],
};

const crawlerChecker: LandingContent = {
  slug: 'ai-crawler-robots-txt-checker',
  title: 'AI Crawler Robots.txt Checker',
  metaTitle: 'AI Crawler Robots.txt Checker | AIVO Insights',
  metaDescription: 'Check whether robots.txt blocks or allows major AI crawlers and whether redirects, timeouts, and page limits affect crawl access.',
  eyebrow: 'Crawler access audit',
  intro: 'Verify that your public pages can be fetched by AI crawlers before your team spends time rewriting content or adding schema.',
  primarySections: [
    {
      heading: 'Why crawl access comes first',
      body: 'AI visibility work fails when crawlers cannot reach the pages that contain your best evidence. Before a team rewrites content, adds FAQ sections, or creates schema, it should know whether robots.txt allows relevant crawlers, whether the sitemap is valid, whether redirects are controlled, and whether core pages can be fetched within a reasonable timeout. AIVO starts with these checks because they are deterministic and actionable. If an important crawler is blocked, the issue belongs to engineering or whoever manages the robots policy. If the page returns an error or a script-only shell, content changes may not be visible to lightweight fetchers.',
    },
    {
      heading: 'What the robots.txt check covers',
      body: 'The scanner checks robots directives for GPTBot, ChatGPT-User, ClaudeBot, Claude-Web, PerplexityBot, and Google-Extended. It does not assume every business should allow every crawler. Some teams deliberately restrict access for legal, licensing, or competitive reasons. The point is to make the policy visible. If your business wants AI answer engines to understand public product pages, blocking the relevant crawlers may be counterproductive. If your business has a stricter policy, the report can still help document the tradeoff. AIVO also checks whether the sitemap and llms.txt create a coherent picture of what should be crawled.',
    },
    {
      heading: 'Other crawl problems the scan can reveal',
      body: 'Robots directives are only one part of access. Redirect loops, excessive redirects, large responses, slow pages, invalid TLS, malformed sitemap XML, and private IP targets can all prevent a reliable scan. AIVO caps redirects, applies fetch timeouts, limits bytes per page, and blocks private network targets for safety. Those same controls mirror practical crawler constraints. If a page requires a browser to render nearly all meaningful content, the report may flag client-side rendering shell risk. That finding matters because answer engines and third-party crawlers may not execute your app exactly like a logged-in browser.',
    },
    {
      heading: 'How to use crawler findings',
      body: 'A blocked crawler is usually a small file change, but it should be reviewed with policy intent. A malformed sitemap may require a CMS or build-script fix. A redirect issue may point to inconsistent canonical URLs, forced geography redirects, or old hosting rules. A timeout can mean an origin performance issue, bot mitigation challenge, or oversized page. The report separates these findings from content recommendations so developers can fix access before marketers interpret low content scores. Once access is healthy, the rest of the scan becomes more trustworthy.',
    },
  ],
  checklistHeading: 'Crawler access controls',
  checklist: [
    'Robots.txt directives for major AI crawlers are explicit and match business policy.',
    'Sitemap XML is valid, current, and points to canonical public pages.',
    'Redirects are capped and do not hide the final canonical URL.',
    'Important pages return HTML within timeout and byte limits.',
    'Client-side rendering does not hide the main entity, offer, FAQs, or trust evidence.',
  ],
  faq: [
    {
      question: 'Should every AI crawler be allowed?',
      answer: 'Not necessarily. The right policy depends on your legal, licensing, and content strategy. AIVO makes the current policy visible so teams can decide deliberately.',
    },
    {
      question: 'Can robots.txt alone improve AI visibility?',
      answer: 'No. Allowing crawlers only makes content reachable. The pages still need clear structure, entity context, answer-ready copy, and trust evidence.',
    },
    {
      question: 'Why does AIVO block private IP addresses?',
      answer: 'Public scanning must not be used to reach internal networks. AIVO blocks localhost and private network ranges as a security control.',
    },
  ],
};

const checklistPage: LandingContent = {
  slug: 'geo-audit-checklist',
  title: 'GEO Audit Checklist for AI Search Visibility',
  metaTitle: 'GEO Audit Checklist | AIVO Insights',
  metaDescription: 'Use a practical GEO audit checklist covering crawl access, entity clarity, answer readiness, citation likelihood, trust evidence, and competitive presence.',
  eyebrow: 'Generative engine optimization',
  intro: 'Use this checklist to audit whether your website is ready for AI-assisted discovery, then run a free scan to get evidence-specific fixes.',
  primarySections: [
    {
      heading: 'Start with access and inventory',
      body: 'A useful GEO audit begins with the public inventory of pages and system files. Confirm that robots.txt matches your crawler policy, sitemap.xml is valid, llms.txt exists if you use it, and the homepage plus core pages return meaningful HTML. Identify the pages that should explain the brand, product, services, proof, policies, and support. AIVO automates this first pass by fetching system files and a capped set of important pages. The output helps you see whether the audit is starting from reliable evidence or from a partial crawl. Without this step, teams can spend time optimizing pages that answer engines may never fetch.',
    },
    {
      heading: 'Make the entity unambiguous',
      body: 'Entity clarity is the foundation of AI visibility. The site should clearly state the company or brand name, category, audience, geography if relevant, main offer, differentiators, and relationship between products or services. Ambiguous hero copy, vague category labels, and unsupported taglines make summarization harder. Schema can help, but visible content matters too. A good audit checks the homepage, about page, service pages, product pages, and FAQ for consistent language. It also checks whether the organization or product is connected to stable URLs, contact details, policies, and proof points. AIVO turns these checks into a score and evidence list.',
    },
    {
      heading: 'Write for answer extraction',
      body: 'Answer readiness means the page can satisfy common questions without forcing a model to infer the basics. Strong pages include direct definitions, concise service descriptions, comparison context, limitations, pricing or process explanations where appropriate, and FAQs that match real buyer concerns. Headings should create a logical outline. Paragraphs should include specific nouns and facts instead of abstract claims. For technical products, documentation and integration pages often matter as much as marketing pages. For local businesses, service area, credentials, and contact details matter. The audit should identify missing questions and thin sections before recommending broad rewrites.',
    },
    {
      heading: 'Support claims with trust evidence',
      body: 'GEO work is not only about being readable. It is also about being credible. AI systems are less likely to rely on pages that make claims without support. A practical audit checks for testimonials, reviews, case studies, author details, certifications, policies, security pages, refund information, privacy details, and contact paths. The right proof depends on the business model. A cybersecurity firm needs security and expertise evidence. An ecommerce store needs product details and policies. A consultant needs credentials and examples. AIVO separates trust evidence from answer readiness so teams can see whether the problem is how content is written or whether proof is missing.',
    },
  ],
  checklistHeading: 'GEO audit checklist',
  checklist: [
    'Crawl access: robots policy, redirects, sitemap, llms.txt, timeout, byte limits, and rendering risk.',
    'Entity clarity: name, category, audience, geography, services, products, and differentiators.',
    'Answer readiness: direct answers, FAQ coverage, heading order, definitions, comparisons, and next steps.',
    'Citation likelihood: stable URLs, source-worthy pages, schema, policies, documentation, and proof.',
    'Trust evidence: authorship, reviews, credentials, contact details, privacy, security, and customer examples.',
  ],
  faq: [
    {
      question: 'What does GEO mean?',
      answer: 'GEO stands for generative engine optimization. It focuses on making public content easier for AI answer systems to crawl, understand, summarize, and cite.',
    },
    {
      question: 'How often should I run a GEO audit?',
      answer: 'Run an audit after redesigns, major content changes, new product launches, robots policy changes, or quarterly for active sites.',
    },
    {
      question: 'Who should own GEO fixes?',
      answer: 'Ownership is usually shared. Developers handle crawl access and schema, marketers handle positioning and answers, and business owners provide proof and trust evidence.',
    },
  ],
};

export function FreeAIVisibilityChecker() {
  return <GeoLandingPage content={freeChecker} />;
}

export function ChatGPTSEOChecker() {
  return <GeoLandingPage content={chatgptChecker} />;
}

export function AICitationChecker() {
  return <GeoLandingPage content={citationChecker} />;
}

export function LlmsTxtChecker() {
  return <GeoLandingPage content={llmsTxtChecker} />;
}

export function AICrawlerRobotsTxtChecker() {
  return <GeoLandingPage content={crawlerChecker} />;
}

export function GeoAuditChecklist() {
  return <GeoLandingPage content={checklistPage} />;
}
