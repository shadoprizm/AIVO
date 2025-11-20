import { Link } from 'react-router-dom';
import { Brain, Search, Target, TrendingUp, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Button from '../components/ui/Button';

export default function Home() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AIVO Insights',
    description: 'AI Visibility Optimization platform that analyzes websites for AI model discoverability',
    url: 'https://aivoinsights.com',
    logo: 'https://aivoinsights.com/logo.png',
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@aivoinsights.com',
      contactType: 'Customer Service',
    },
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'AIVO Insights',
    applicationCategory: 'WebApplication',
    description: 'Optimize your website for AI visibility. Analyze how AI models interpret your content and get actionable recommendations to improve discoverability.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
  };

  return (
    <MarketingLayout>
      <SEOHead
        title="AIVO Insights - Optimize Your Website for AI Visibility"
        description="Analyze how AI models like ChatGPT, Claude, and Gemini interpret your website. Get your AIVO Score and actionable recommendations to improve AI discoverability."
        canonical="https://aivoinsights.com"
        ogTitle="AIVO Insights - Optimize Your Website for AI Visibility"
        ogDescription="Analyze how AI models interpret your content. Get your AIVO Score and recommendations to improve discoverability."
        ogImage="https://aivoinsights.com/og-image.png"
        ogType="website"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />

      <article>
        <section className="bg-gradient-to-b from-blue-50 to-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Optimize Your Website for AI Visibility
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover how AI models like ChatGPT, Claude, and Gemini interpret your content. Get your AIVO Score and actionable insights to improve discoverability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/signup">
                <Button size="lg">Analyze Your Site for Free</Button>
              </Link>
              <Link to="/how-it-works">
                <Button size="lg" variant="outline">See How It Works</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
              Why AI Visibility Matters
            </h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-700 mb-4">
                The way people discover information is fundamentally changing. AI assistants like ChatGPT, Claude, and Gemini are becoming primary research tools, answering questions and providing recommendations without users ever visiting a search engine.
              </p>
              <p className="text-lg text-gray-700 mb-4">
                Studies show that over 60% of professionals now use AI tools for research and decision-making. If your content isn't optimized for AI interpretation, you're invisible to a rapidly growing segment of your potential audience.
              </p>
              <p className="text-lg text-gray-700">
                Traditional SEO focused on keywords and backlinks. AI visibility requires clear structure, semantic markup, authoritative content, and Q&A formatting that AI models can easily parse and cite.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
              Introducing AIVO Insights
            </h2>
            <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
              AIVO Insights analyzes your website through the lens of AI models, providing a quantifiable score and clear recommendations for improvement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Get Your AIVO Score
                </h3>
                <p className="text-gray-700">
                  Receive a comprehensive 0-100 score that measures how effectively AI models can interpret and cite your content, with breakdowns by category.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Understand Your Gaps
                </h3>
                <p className="text-gray-700">
                  Identify specific weaknesses in content clarity, semantic structure, schema markup, Q&A readiness, and authority signals that limit AI visibility.
                </p>
              </div>

              <div className="bg-white p-8 rounded-xl shadow-sm">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Implement Recommendations
                </h3>
                <p className="text-gray-700">
                  Get prioritized, actionable recommendations generated by AI, tailored to your specific content and technical implementation.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              How AIVO Insights Works
            </h2>

            <div className="max-w-4xl mx-auto space-y-12">
              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  1
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Submit Your Website URL
                  </h3>
                  <p className="text-lg text-gray-700">
                    Simply enter your website URL in our dashboard. AIVO Insights will fetch your content and prepare it for analysis.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  2
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    We Analyze AI Readability
                  </h3>
                  <p className="text-lg text-gray-700">
                    Our AI engine evaluates your content structure, semantic HTML, schema markup, heading hierarchy, content clarity, and Q&A formatting against best practices for AI interpretation.
                  </p>
                </div>
              </div>

              <div className="flex gap-6 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
                  3
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                    Get Actionable Insights
                  </h3>
                  <p className="text-lg text-gray-700">
                    Review your detailed AIVO Score breakdown and prioritized recommendations. Track improvements over time as you optimize your content for AI visibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Benefits of Optimizing for AI
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Sparkles className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Increase AI Citations
                </h3>
                <p className="text-gray-700">
                  Make your content more likely to be cited and recommended by AI assistants when users ask relevant questions.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Brain className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Improve Content Clarity
                </h3>
                <p className="text-gray-700">
                  Structured, well-organized content benefits both AI models and human readers, improving overall user experience.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <TrendingUp className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Future-Proof Your SEO
                </h3>
                <p className="text-gray-700">
                  As search evolves toward AI-powered answers, positioning your content for AI interpretation protects your visibility.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Shield className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Build Authority
                </h3>
                <p className="text-gray-700">
                  AI models favor authoritative, well-structured content. Optimization signals expertise and trustworthiness.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <Zap className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Faster Implementation
                </h3>
                <p className="text-gray-700">
                  Get specific, prioritized recommendations rather than generic advice, accelerating your optimization efforts.
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <BarChart3 className="w-8 h-8 text-blue-600 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Track Progress
                </h3>
                <p className="text-gray-700">
                  Monitor your AIVO Score over time and measure the impact of optimizations with historical scan data.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  What is the AIVO Score?
                </h3>
                <p className="text-gray-700">
                  The AIVO Score is a comprehensive 0-100 rating that measures how effectively AI language models can interpret, understand, and cite your website content. It evaluates multiple dimensions including content clarity, semantic structure, schema markup, Q&A readiness, and authority signals.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  How does AI visibility differ from traditional SEO?
                </h3>
                <p className="text-gray-700">
                  Traditional SEO focuses on keyword optimization and backlinks to rank in search engine results. AI visibility optimization ensures your content is structured and formatted in ways that AI models can easily parse, understand, and reference when answering user questions. This includes semantic HTML, clear heading hierarchies, Q&A formatting, and factual clarity.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Which AI models does AIVO analyze for?
                </h3>
                <p className="text-gray-700">
                  AIVO Insights evaluates your content based on how major AI language models interpret information, including ChatGPT, Claude, Gemini, and other leading AI assistants. Our analysis focuses on universal best practices that improve visibility across all AI platforms.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  How often should I scan my site?
                </h3>
                <p className="text-gray-700">
                  We recommend scanning after significant content updates or redesigns. For actively maintained sites, quarterly scans help track progress and identify new optimization opportunities. Our platform maintains scan history so you can monitor improvements over time.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Do I need technical expertise to implement recommendations?
                </h3>
                <p className="text-gray-700">
                  Our recommendations range from simple content adjustments to technical implementations. Many improvements, like restructuring headings and adding Q&A sections, require no coding. For technical changes like schema markup, we provide clear, actionable guidance suitable for developers of all skill levels.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Is there a free tier available?
                </h3>
                <p className="text-gray-700">
                  Yes! Our free tier includes limited monthly scans so you can evaluate AIVO Insights and begin optimizing your content. Paid plans offer unlimited scans, historical tracking, priority support, and advanced features.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Start Optimizing for AI Today
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join forward-thinking companies improving their AI visibility. Get your free AIVO Score in minutes.
            </p>
            <Link to="/signup">
              <Button size="lg" variant="white">
                Get Your Free AIVO Score
              </Button>
            </Link>
            <p className="mt-4 text-sm text-blue-100">
              No credit card required. Start optimizing immediately.
            </p>
          </div>
        </section>
      </article>
    </MarketingLayout>
  );
}
