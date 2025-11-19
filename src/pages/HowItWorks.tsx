import { Link } from 'react-router-dom';
import { Brain, FileText, CheckCircle2, TrendingUp, Code, MessageSquare } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Button from '../components/ui/Button';

export default function HowItWorks() {
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'How AIVO Insights Works',
    description: 'Understanding AI visibility optimization and the AIVO methodology for improving your website\'s AI discoverability',
    author: {
      '@type': 'Organization',
      name: 'AIVO Insights',
    },
    publisher: {
      '@type': 'Organization',
      name: 'AIVO Insights',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aivoinsights.com/logo.png',
      },
    },
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString().split('T')[0],
  };

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Optimize Your Website for AI Visibility with AIVO Insights',
    description: 'Learn how AIVO Insights analyzes your website for AI visibility and provides actionable recommendations',
    step: [
      {
        '@type': 'HowToStep',
        name: 'Submit Your Website URL',
        text: 'Enter your website URL in the AIVO Insights dashboard to begin analysis',
        position: 1,
      },
      {
        '@type': 'HowToStep',
        name: 'AI Analysis',
        text: 'Our AI engine evaluates content structure, semantic HTML, schema markup, and other factors',
        position: 2,
      },
      {
        '@type': 'HowToStep',
        name: 'Review Results',
        text: 'Get your AIVO Score breakdown and prioritized recommendations',
        position: 3,
      },
    ],
  };

  return (
    <MarketingLayout>
      <SEOHead
        title="How AIVO Insights Works - AI Visibility Optimization"
        description="Learn how AIVO Insights analyzes your website for AI visibility. Understanding the AIVO methodology, scoring categories, and optimization best practices for AI models."
        canonical="https://aivoinsights.com/how-it-works"
        ogTitle="How AIVO Insights Works"
        ogDescription="Understand AI visibility optimization and the AIVO methodology for improving your website's AI discoverability."
        ogImage="https://aivoinsights.com/og-image.png"
        ogType="article"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      <article>
        <section className="bg-gradient-to-b from-blue-50 to-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              How AIVO Insights Works
            </h1>
            <p className="text-xl text-gray-600">
              Understanding AI visibility optimization and the AIVO methodology
            </p>
          </div>
        </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            The Rise of AI-Driven Search
          </h2>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-4">
              We are witnessing a fundamental shift in how people discover and consume information. Traditional search engines are no longer the primary gateway to knowledge. AI assistants like ChatGPT, Claude, Gemini, and Perplexity have emerged as powerful research tools, answering questions directly without requiring users to visit multiple websites.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Research indicates that over 60% of professionals now use AI language models for business research, competitive analysis, and decision-making. These tools don't just retrieve links—they synthesize information, provide summaries, and offer recommendations based on their interpretation of available content.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              This shift creates a critical challenge for businesses and content creators: if AI models cannot easily interpret and cite your content, you become invisible to a rapidly growing segment of your target audience. Traditional SEO tactics focused on keywords and backlinks are no longer sufficient.
            </p>
            <p className="text-lg text-gray-700">
              AI visibility optimization represents the next evolution of digital discoverability, ensuring your content is structured and formatted in ways that AI models can understand, trust, and reference.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            What Makes Content AI-Readable
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            AI language models process content differently than search engines. Understanding these differences is key to optimization.
          </p>

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Semantic Structure and Hierarchy
                  </h3>
                  <p className="text-gray-700">
                    AI models rely heavily on HTML structure to understand content relationships. Proper heading hierarchies, semantic HTML5 tags, and logical document outlines help models identify main topics, subtopics, and supporting information. Pages with clear structure are more likely to be cited accurately.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Question and Answer Formatting
                  </h3>
                  <p className="text-gray-700">
                    AI assistants are primarily used to answer questions. Content formatted as clear questions with direct answers is significantly more discoverable. FAQ sections, definition lists, and explicit Q&A structures make it easy for models to extract and present relevant information when users ask related questions.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Schema Markup and Metadata
                  </h3>
                  <p className="text-gray-700">
                    Structured data using Schema.org vocabulary provides explicit context about your content. While AI models can understand plain text, schema markup removes ambiguity and provides clear signals about entities, relationships, and content types. This increases the likelihood of accurate interpretation and citation.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Content Clarity and Factual Precision
                  </h3>
                  <p className="text-gray-700">
                    AI models prefer clear, factual statements over marketing hyperbole or vague claims. Specific data points, clear definitions, and unambiguous explanations improve both interpretation accuracy and citation likelihood. Concise paragraphs and scannable formatting further enhance readability.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Authority and Credibility Signals
                  </h3>
                  <p className="text-gray-700">
                    AI models assess source reliability when determining what information to cite. Author credentials, publication dates, source citations, domain authority, and consistent accuracy all contribute to perceived trustworthiness. Establishing expertise through comprehensive, well-researched content improves AI visibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            The AIVO Methodology
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            AIVO Insights applies a comprehensive, multi-dimensional analysis framework to evaluate AI visibility.
          </p>

          <div className="prose prose-lg max-w-none mb-8">
            <p className="text-lg text-gray-700 mb-4">
              Our AI-powered analysis engine examines your website across multiple critical dimensions, each contributing to your overall AIVO Score. The methodology is based on research into how large language models process and prioritize information, combined with best practices from semantic web standards and information architecture.
            </p>
            <p className="text-lg text-gray-700">
              Each dimension receives a category score from 0 to 100, with detailed findings highlighting specific strengths and weaknesses. These category scores are weighted and combined to produce your overall AIVO Score.
            </p>
          </div>

          <div className="bg-gray-50 p-8 rounded-xl">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              AIVO Score Categories
            </h3>
            <dl className="space-y-6">
              <div>
                <dt className="text-lg font-semibold text-gray-900 mb-2">
                  Content Clarity
                </dt>
                <dd className="text-gray-700">
                  Evaluates how clearly and concisely information is presented. Measures paragraph length, sentence complexity, use of definitions, and overall readability for both humans and AI.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-semibold text-gray-900 mb-2">
                  Semantic Structure
                </dt>
                <dd className="text-gray-700">
                  Assesses HTML document structure, heading hierarchy, use of semantic HTML5 elements, and logical content organization. Proper structure enables accurate interpretation of content relationships.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-semibold text-gray-900 mb-2">
                  Schema and Metadata
                </dt>
                <dd className="text-gray-700">
                  Analyzes structured data implementation, including Schema.org markup, Open Graph tags, and other metadata that provides explicit context about your content and organization.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-semibold text-gray-900 mb-2">
                  Question and Answer Readiness
                </dt>
                <dd className="text-gray-700">
                  Measures how well content is formatted for question-answering scenarios. Evaluates FAQ sections, definition structures, and explicit Q&A formatting that AI models can easily extract and present.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-semibold text-gray-900 mb-2">
                  Authority and Trust Signals
                </dt>
                <dd className="text-gray-700">
                  Examines credibility indicators including author information, publication dates, source citations, domain authority, and consistency of factual claims. Strong authority signals increase citation likelihood.
                </dd>
              </div>

              <div>
                <dt className="text-lg font-semibold text-gray-900 mb-2">
                  Technical Accessibility
                </dt>
                <dd className="text-gray-700">
                  Evaluates technical factors that affect AI model access, including page load speed, mobile responsiveness, clean HTML, and absence of barriers that might prevent content analysis.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Understanding Your Score Breakdown
          </h2>

          <div className="bg-white p-8 rounded-xl shadow-sm mb-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Overall AIVO Score Ranges
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-20 text-center font-bold text-green-600">
                  80-100
                </div>
                <div className="flex-grow">
                  <div className="font-semibold text-gray-900">Excellent</div>
                  <div className="text-sm text-gray-600">
                    Your content is highly optimized for AI visibility with strong structure, clarity, and authority signals.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-20 text-center font-bold text-blue-600">
                  60-79
                </div>
                <div className="flex-grow">
                  <div className="font-semibold text-gray-900">Good</div>
                  <div className="text-sm text-gray-600">
                    Your content has solid foundations with some opportunities for improvement in specific categories.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-20 text-center font-bold text-yellow-600">
                  40-59
                </div>
                <div className="flex-grow">
                  <div className="font-semibold text-gray-900">Fair</div>
                  <div className="text-sm text-gray-600">
                    Your content is partially optimized but has significant gaps that limit AI discoverability.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-20 text-center font-bold text-red-600">
                  0-39
                </div>
                <div className="flex-grow">
                  <div className="font-semibold text-gray-900">Needs Improvement</div>
                  <div className="text-sm text-gray-600">
                    Your content requires substantial optimization to improve AI visibility and citation likelihood.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-gray-700 mb-4">
              After each scan, you will receive a detailed breakdown showing your score in each category, along with specific findings and prioritized recommendations. Our AI-generated recommendations are tailored to your content and technical stack, providing actionable next steps rather than generic advice.
            </p>
            <p className="text-lg text-gray-700">
              Track your progress over time by running periodic scans. Historical data helps you measure the impact of optimizations and identify new opportunities as your content evolves.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-6">
            Ready to Improve Your AI Visibility?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Get your comprehensive AIVO Score and start optimizing your content for AI discoverability today.
          </p>
          <Link to="/signup">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Analyze Your Website Now
            </Button>
          </Link>
        </div>
      </section>
      </article>
    </MarketingLayout>
  );
}
