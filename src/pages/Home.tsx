import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Brain, Search, Target, TrendingUp, Sparkles, Shield, Zap, BarChart3 } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import Button from '../components/ui/Button';
import { HeroSection } from '../components/hero';
import { AnimatedSection, AnimatedCard, StaggerContainer, StaggerItem } from '../components/ui/AnimatedSection';
import { SITE } from '../config/site';

export default function Home() {
  const siteUrl = SITE.url.replace(/\/$/, '');
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE.name,
    description: 'AI Visibility Optimization platform that analyzes websites for AI model discoverability',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [],
    contactPoint: {
      '@type': 'ContactPoint',
      email: SITE.supportEmail,
      contactType: 'Customer Service',
    },
  };

  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE.name,
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

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the AIVO Score?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The AIVO Score is a comprehensive 0-100 rating that measures how effectively AI language models can interpret, understand, and cite your website content. It evaluates multiple dimensions including content clarity, semantic structure, schema markup, Q&A readiness, and authority signals.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does AI visibility differ from traditional SEO?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Traditional SEO focuses on keyword optimization and backlinks to rank in search engine results. AI visibility optimization ensures your content is structured and formatted in ways that AI models can easily parse, understand, and reference when answering user questions. This includes semantic HTML, clear heading hierarchies, Q&A formatting, and factual clarity.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which AI models does AIVO analyze for?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'AIVO Insights evaluates your content based on how major AI language models interpret information, including ChatGPT, Claude, Gemini, and other leading AI assistants. Our analysis focuses on universal best practices that improve visibility across all AI platforms.',
        },
      },
      {
        '@type': 'Question',
        name: 'How often should I scan my site?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We recommend scanning after significant content updates or redesigns. For actively maintained sites, quarterly scans help track progress and identify new optimization opportunities. Our platform maintains scan history so you can monitor improvements over time.',
        },
      },
      {
        '@type': 'Question',
        name: 'Do I need technical expertise to implement recommendations?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our recommendations range from simple content adjustments to technical implementations. Many improvements, like restructuring headings and adding Q&A sections, require no coding. For technical changes like schema markup, we provide clear, actionable guidance suitable for developers of all skill levels.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is there a free tier available?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! Our free tier includes limited monthly scans so you can evaluate AIVO Insights and begin optimizing your content. Paid plans offer unlimited scans, historical tracking, priority support, and advanced features.',
        },
      },
    ],
  };

  return (
    <MarketingLayout>
      <SEOHead
        title="AIVO Insights - Optimize Your Website for AI Visibility"
        description="Analyze how AI models like ChatGPT, Claude, and Gemini interpret your website. Get your AIVO Score and actionable recommendations to improve AI discoverability."
        canonical={siteUrl}
        ogTitle="AIVO Insights - Optimize Your Website for AI Visibility"
        ogDescription="Analyze how AI models interpret your content. Get your AIVO Score and recommendations to improve discoverability."
        ogImage={`${siteUrl}/og-image.png`}
        ogType="website"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article>
        {/* New animated hero section */}
        <HeroSection />

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">
                Why AI Visibility Matters
              </h2>
            </AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <AnimatedSection delay={0.1}>
                <p className="text-lg text-gray-700 mb-6">
                  The way people discover information is fundamentally changing. AI assistants like ChatGPT, Claude, and Gemini are becoming primary research tools, answering questions and providing recommendations without users ever visiting a search engine.
                </p>
              </AnimatedSection>

              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <AnimatedSection delay={0.2}>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 h-full">
                    <h3 className="text-xl font-semibold text-blue-900 mb-3">The Shift in Search</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                        <span>Over 60% of professionals now use AI tools for research and decision-making.</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                        <span>AI models act as gatekeepers, deciding which sources to cite and recommend.</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2.5 flex-shrink-0" />
                        <span>Traditional SEO tactics don't guarantee visibility in AI-generated answers.</span>
                      </li>
                    </ul>
                  </div>
                </AnimatedSection>

                <AnimatedSection delay={0.3}>
                  <div className="bg-purple-50 p-6 rounded-xl border border-purple-100 h-full">
                    <h3 className="text-xl font-semibold text-purple-900 mb-3">What AI Models Need</h3>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-2 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2.5 flex-shrink-0" />
                        <span>Clear semantic structure and logical heading hierarchy.</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2.5 flex-shrink-0" />
                        <span>Explicit Q&A formatting that models can easily parse.</span>
                      </li>
                      <li className="flex items-start gap-2 text-gray-700">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full mt-2.5 flex-shrink-0" />
                        <span>Authoritative signals and verifiable data points.</span>
                      </li>
                    </ul>
                  </div>
                </AnimatedSection>
              </div>

              <AnimatedSection delay={0.4}>
                <p className="text-lg text-gray-700 text-center italic">
                  "If your content isn't optimized for AI interpretation, you're invisible to a rapidly growing segment of your potential audience."
                </p>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-gray-900 mb-4 text-center">
                Introducing AIVO Insights
              </h2>
              <p className="text-xl text-gray-600 mb-12 text-center max-w-3xl mx-auto">
                AIVO Insights analyzes your website through the lens of AI models, providing a quantifiable score and clear recommendations for improvement.
              </p>
            </AnimatedSection>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StaggerItem>
                <AnimatedCard className="bg-white p-8 rounded-xl shadow-sm h-full">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Get Your AIVO Score
                  </h3>
                  <p className="text-gray-700">
                    Receive a comprehensive 0-100 score that measures how effectively AI models can interpret and cite your content, with breakdowns by category.
                  </p>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard className="bg-white p-8 rounded-xl shadow-sm h-full">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Search className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Understand Your Gaps
                  </h3>
                  <p className="text-gray-700">
                    Identify specific weaknesses in content clarity, semantic structure, schema markup, Q&A readiness, and authority signals that limit AI visibility.
                  </p>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard className="bg-white p-8 rounded-xl shadow-sm h-full">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Implement Recommendations
                  </h3>
                  <p className="text-gray-700">
                    Get prioritized, actionable recommendations generated by AI, tailored to your specific content and technical implementation.
                  </p>
                </AnimatedCard>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
                How AIVO Insights Works
              </h2>
            </AnimatedSection>

            <div className="max-w-4xl mx-auto space-y-12">
              <AnimatedSection delay={0.1}>
                <div className="flex gap-6 items-start">
                  <motion.div
                    className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    1
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      Submit Your Website URL
                    </h3>
                    <p className="text-lg text-gray-700">
                      Simply enter your website URL in our dashboard. AIVO Insights will fetch your content and prepare it for analysis.
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div className="flex gap-6 items-start">
                  <motion.div
                    className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    2
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      We Analyze AI Readability
                    </h3>
                    <p className="text-lg text-gray-700">
                      Our AI engine evaluates your content structure, semantic HTML, schema markup, heading hierarchy, content clarity, and Q&A formatting against best practices for AI interpretation.
                    </p>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <div className="flex gap-6 items-start">
                  <motion.div
                    className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                  >
                    3
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                      Get Actionable Insights
                    </h3>
                    <p className="text-lg text-gray-700">
                      Review your detailed AIVO Score breakdown and prioritized recommendations. Track improvements over time as you optimize your content for AI visibility.
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
                Benefits of Optimizing for AI
              </h2>
            </AnimatedSection>

            <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <StaggerItem>
                <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm h-full">
                  <Sparkles className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Increase AI Citations
                  </h3>
                  <p className="text-gray-700">
                    Make your content more likely to be cited and recommended by AI assistants when users ask relevant questions.
                  </p>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm h-full">
                  <Brain className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Improve Content Clarity
                  </h3>
                  <p className="text-gray-700">
                    Structured, well-organized content benefits both AI models and human readers, improving overall user experience.
                  </p>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm h-full">
                  <TrendingUp className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Future-Proof Your SEO
                  </h3>
                  <p className="text-gray-700">
                    As search evolves toward AI-powered answers, positioning your content for AI interpretation protects your visibility.
                  </p>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm h-full">
                  <Shield className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Build Authority
                  </h3>
                  <p className="text-gray-700">
                    AI models favor authoritative, well-structured content. Optimization signals expertise and trustworthiness.
                  </p>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm h-full">
                  <Zap className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Faster Implementation
                  </h3>
                  <p className="text-gray-700">
                    Get specific, prioritized recommendations rather than generic advice, accelerating your optimization efforts.
                  </p>
                </AnimatedCard>
              </StaggerItem>

              <StaggerItem>
                <AnimatedCard className="bg-white p-6 rounded-xl shadow-sm h-full">
                  <BarChart3 className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Track Progress
                  </h3>
                  <p className="text-gray-700">
                    Monitor your AIVO Score over time and measure the impact of optimizations with historical scan data.
                  </p>
                </AnimatedCard>
              </StaggerItem>
            </StaggerContainer>
          </div>
        </section>

        <section id="faq" className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <AnimatedSection>
              <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
                Frequently Asked Questions
              </h2>
            </AnimatedSection>

            <div className="space-y-8">
              <AnimatedSection delay={0.1}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    What is the AIVO Score?
                  </h3>
                  <p className="text-gray-700">
                    The AIVO Score is a comprehensive 0-100 rating that measures how effectively AI language models can interpret, understand, and cite your website content. It evaluates multiple dimensions including content clarity, semantic structure, schema markup, Q&A readiness, and authority signals.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.15}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    How does AI visibility differ from traditional SEO?
                  </h3>
                  <p className="text-gray-700">
                    Traditional SEO focuses on keyword optimization and backlinks to rank in search engine results. AI visibility optimization ensures your content is structured and formatted in ways that AI models can easily parse, understand, and reference when answering user questions. This includes semantic HTML, clear heading hierarchies, Q&A formatting, and factual clarity.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.2}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Which AI models does AIVO analyze for?
                  </h3>
                  <p className="text-gray-700">
                    AIVO Insights evaluates your content based on how major AI language models interpret information, including ChatGPT, Claude, Gemini, and other leading AI assistants. Our analysis focuses on universal best practices that improve visibility across all AI platforms.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.25}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    How often should I scan my site?
                  </h3>
                  <p className="text-gray-700">
                    We recommend scanning after significant content updates or redesigns. For actively maintained sites, quarterly scans help track progress and identify new optimization opportunities. Our platform maintains scan history so you can monitor improvements over time.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Do I need technical expertise to implement recommendations?
                  </h3>
                  <p className="text-gray-700">
                    Our recommendations range from simple content adjustments to technical implementations. Many improvements, like restructuring headings and adding Q&A sections, require no coding. For technical changes like schema markup, we provide clear, actionable guidance suitable for developers of all skill levels.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.35}>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Is there a free tier available?
                  </h3>
                  <p className="text-gray-700">
                    Yes! Our free tier includes limited monthly scans so you can evaluate AIVO Insights and begin optimizing your content. Paid plans offer unlimited scans, historical tracking, priority support, and advanced features.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        <section className="py-20 bg-blue-600 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <AnimatedSection>
              <h2 className="text-4xl font-bold mb-6">
                Start Optimizing for AI Today
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.1}>
              <p className="text-xl mb-8 text-blue-100">
                Join forward-thinking companies improving their AI visibility. Get your free AIVO Score in minutes.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <Link to="/signup">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-block"
                >
                  <Button size="lg" variant="white">
                    Get Your Free AIVO Score
                  </Button>
                </motion.div>
              </Link>
              <p className="mt-4 text-sm text-blue-100">
                No credit card required. Start optimizing immediately.
              </p>
            </AnimatedSection>
          </div>
        </section>
      </article>
    </MarketingLayout>
  );
}
