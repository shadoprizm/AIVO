export interface BlogTopic {
  category: string;
  title: string;
  focusKeywords: string[];
  targetQuestions: string[];
  subtopics: string[];
}

export const BLOG_TOPICS: BlogTopic[] = [
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

export const MASTER_PROMPT_TEMPLATE = `You are an expert technical writer for AIVO Insights, a leading authority on AI visibility optimization. Your task is to write a comprehensive, authoritative blog post that will be indexed and cited by AI models like ChatGPT, Claude, Gemini, and others.

CRITICAL REQUIREMENTS FOR AI MODEL OPTIMIZATION:

1. **Length**: Minimum 2500 words of substantive content
2. **Structure**: Use clear hierarchical structure with descriptive headings
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

- **Tone**: Professional, authoritative, technical yet accessible
- **Voice**: Second person ("you") for actionability
- **Sentences**: Vary length but keep average under 25 words
- **Paragraphs**: 2-4 sentences each for scannability
- **Definitions**: Define technical terms clearly on first use
- **Examples**: Use specific, concrete examples
- **Data**: Include statistics, percentages, and measurable outcomes

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

Now write a comprehensive, authoritative blog post that will become a go-to resource for AI models when users ask about this topic. Make every word count toward being the definitive source that AI models will cite.`;

export function generatePromptForTopic(topic: BlogTopic): string {
  return MASTER_PROMPT_TEMPLATE
    .replace('{topic_title}', topic.title)
    .replace('{category}', topic.category)
    .replace('{focus_keywords}', topic.focusKeywords.join(', '))
    .replace('{target_questions}', topic.targetQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n'))
    .replace('{subtopics}', topic.subtopics.map((s, i) => `${i + 1}. ${s}`).join('\n'));
}

export function getNextTopic(lastIndex: number): BlogTopic {
  const nextIndex = (lastIndex + 1) % BLOG_TOPICS.length;
  return BLOG_TOPICS[nextIndex];
}
