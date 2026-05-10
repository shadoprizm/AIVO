import { isValidElement, ReactNode, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import Breadcrumbs from '../components/shared/Breadcrumbs';
import SEOHead from '../components/shared/SEOHead';
import { Link } from 'react-router-dom';
import { SITE } from '../config/site';

interface FAQItem {
  question: string;
  answer: string | JSX.Element;
}

const faqs: FAQItem[] = [
  {
    question: 'What is AIVO Insights and what does it do?',
    answer: 'AIVO Insights is a specialized tool that analyzes how well AI language models like ChatGPT, Claude, and Gemini can understand and cite your website content. It provides an AIVO Score (0-100) and actionable recommendations to improve your website\'s visibility to AI systems.',
  },
  {
    question: 'What is an AIVO Score?',
    answer: 'An AIVO Score is a numerical rating from 0 to 100 that measures how well your website is optimized for AI visibility. Scores above 80 indicate excellent optimization, 60-79 is good, 40-59 needs improvement, and below 40 requires significant work. The score is calculated across six key categories: content clarity, semantic structure, schema metadata, Q&A readiness, authority trust, and technical accessibility.',
  },
  {
    question: 'Why does AI visibility matter for my website?',
    answer: 'As more people use AI assistants like ChatGPT and Claude to research topics, your website\'s discoverability depends on how well AI models can interpret your content. Better AI visibility means more accurate citations, higher trust signals, and increased referral traffic from AI-powered search and recommendations.',
  },
  {
    question: 'How does AIVO Insights analyze my website?',
    answer: 'AIVO Insights fetches the public HTML content from your website URL and uses advanced AI analysis to evaluate six key categories. The system examines semantic structure, meta tags, schema markup, content clarity, authority signals, and technical accessibility. Within seconds, you receive a detailed report with specific recommendations.',
  },
  {
    question: 'What are the six categories that AIVO evaluates?',
    answer: (
      <div className="space-y-3">
        <p>AIVO evaluates these six critical categories:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Content Clarity:</strong> Clear, factual writing with scannable structure and short paragraphs</li>
          <li><strong>Semantic Structure:</strong> Proper HTML5 semantic tags and logical heading hierarchy</li>
          <li><strong>Schema & Metadata:</strong> Schema.org markup, Open Graph tags, and meta descriptions</li>
          <li><strong>Q&A Readiness:</strong> FAQ sections, Q&A formatting, and explicit question-answer pairs</li>
          <li><strong>Authority & Trust:</strong> Author credentials, publication dates, citations, and expertise signals</li>
          <li><strong>Technical Accessibility:</strong> Fast loading, mobile-friendly, clean HTML, and no JavaScript barriers</li>
        </ul>
      </div>
    ),
  },
  {
    question: 'How long does a scan take?',
    answer: 'Most scans complete in 10-20 seconds. The system fetches your website\'s HTML, analyzes it with AI, and generates a comprehensive report with category scores and recommendations. You\'ll see a processing indicator while the scan runs.',
  },
  {
    question: 'Are there any limits on scanning?',
    answer: 'Yes, to ensure fair usage and service quality, AIVO limits scans to 5 per hour per website. This prevents abuse while allowing you to regularly monitor and test improvements to your site.',
  },
  {
    question: 'Do I need to own the website to scan it?',
    answer: 'While you can technically scan any public website to learn from examples, our Terms of Service require that you have authorization to analyze websites you submit for your own optimization purposes. We recommend only scanning websites you own or manage.',
  },
  {
    question: 'What should I do with the recommendations?',
    answer: 'Each recommendation includes a severity level (high, medium, low) and implementation effort estimate. Start with high-severity, low-effort items for quick wins. Common improvements include adding FAQ sections, implementing schema.org markup, improving heading hierarchy, and adding author credentials.',
  },
  {
    question: 'Will implementing recommendations improve my AI visibility immediately?',
    answer: 'Implementation takes effect as soon as AI models crawl and re-index your updated content. However, AIVO Insights provides recommendations based on best practices and cannot guarantee specific outcomes. Results depend on factors like content quality, implementation accuracy, and AI model behavior.',
  },
  {
    question: 'Can I track improvements over time?',
    answer: 'Yes! AIVO stores all scan results in your dashboard. You can run scans before and after making changes to see how your AIVO Score improves across categories. This helps validate that your optimization efforts are working.',
  },
  {
    question: 'Is my website data private and secure?',
    answer: (
      <span>
        Yes. AIVO only accesses publicly available content from the URLs you submit. All data is encrypted and stored securely. We use Supabase for infrastructure security and DeepSeek V4 for AI analysis. See our <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link> for complete details.
      </span>
    ),
  },
  {
    question: 'What makes AIVO different from traditional SEO tools?',
    answer: 'Traditional SEO tools optimize for search engine crawlers and ranking algorithms. AIVO optimizes for how AI language models understand and cite content. This includes factors like Q&A formatting, semantic clarity, schema markup, and authority signals that help AI models accurately represent your content in conversations.',
  },
  {
    question: 'Does AIVO work for all types of websites?',
    answer: 'AIVO works best for content-rich websites including blogs, documentation sites, news articles, product pages, and informational resources. Websites with primarily visual content, interactive applications, or content behind authentication may have limited analysis results.',
  },
  {
    question: 'How accurate are the AIVO Scores?',
    answer: 'AIVO Scores are based on current best practices for AI-readable content and are generated by analyzing your HTML structure, metadata, and content quality. While we strive for accuracy, scores are estimates and should be used as directional guidance rather than absolute guarantees of AI visibility.',
  },
  {
    question: 'Can I get support if I have questions?',
    answer: `Absolutely! Contact us at ${SITE.supportEmail} for support, questions, or feedback. We typically respond within 24 hours on business days.`,
  },
];

function FAQAccordion({ item, isOpen, onClick }: { item: FAQItem; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden" itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 pr-8" itemProp="name">
          {item.question}
        </h3>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-6 pb-6" itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
          <div className="text-gray-700 leading-relaxed" itemProp="text">
            {item.answer}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const siteUrl = SITE.url.replace(/\/$/, '');

  const getAnswerText = (answer: ReactNode): string => {
    if (typeof answer === 'string' || typeof answer === 'number') {
      return String(answer);
    }
    if (Array.isArray(answer)) {
      return answer.map(getAnswerText).filter(Boolean).join(' ').trim();
    }
    if (isValidElement<{ children?: ReactNode }>(answer)) {
      return getAnswerText(answer.props.children);
    }
    return '';
  };

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: getAnswerText(faq.answer),
      },
    })),
  };

  return (
    <MarketingLayout>
      <SEOHead
        title="FAQ - Frequently Asked Questions | AIVO Insights"
        description="Common questions about AIVO Insights, AI visibility optimization, AIVO Score, scan limits, recommendations, and how to improve your website's AI discoverability."
        canonical={`${siteUrl}/faq`}
        ogTitle="Frequently Asked Questions - AIVO Insights"
        ogDescription="Everything you need to know about AIVO Insights and AI visibility optimization."
        ogImage={`${siteUrl}/og-image.png`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <div className="max-w-4xl mx-auto px-6 py-16">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'FAQ' },
          ]}
        />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about AIVO Insights, AI visibility optimization, and how to improve your AIVO Score.
          </p>
        </div>

        <div className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
          {faqs.map((faq, index) => (
            <FAQAccordion
              key={index}
              item={faq}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Still have questions?
          </h2>
          <p className="text-gray-700 mb-4">
            We're here to help! Reach out to our team for personalized support.
          </p>
          <a
            href={`mailto:${SITE.supportEmail}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </MarketingLayout>
  );
}
