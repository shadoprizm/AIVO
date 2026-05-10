import { ArrowRight, Briefcase, Building2, LockKeyhole, MapPin, ShoppingCart } from 'lucide-react';
import MarketingLayout from '../components/layouts/MarketingLayout';
import PublicScanForm from '../components/scan/PublicScanForm';
import SEOHead from '../components/shared/SEOHead';
import { SITE } from '../config/site';

interface SampleAudit {
  id: string;
  label: string;
  icon: typeof MapPin;
  context: string;
  found: string[];
  fixes: string[];
}

const samples: SampleAudit[] = [
  {
    id: 'local-service',
    label: 'Local Service Business',
    icon: MapPin,
    context: 'An anonymized home services company with strong reviews but thin service pages and inconsistent location signals.',
    found: [
      'Crawler access was open, but the sitemap omitted several important city and service pages.',
      'The homepage described quality and responsiveness without stating the exact services in the first screen.',
      'Trust evidence existed in testimonials, yet licensing, service area, warranty, and emergency availability were not marked up or grouped clearly.',
    ],
    fixes: [
      'Add LocalBusiness and Service schema to core pages, including service area and contact details.',
      'Rewrite the homepage intro to name the services, region, response model, and proof points directly.',
      'Create answer-ready FAQ blocks for pricing factors, scheduling, warranties, and emergency service limitations.',
    ],
  },
  {
    id: 'saas',
    label: 'B2B SaaS Product',
    icon: Building2,
    context: 'An anonymized SaaS platform with a polished homepage, strong product copy, and weak documentation discoverability.',
    found: [
      'The homepage clearly named the category, but product evidence was split across client-rendered sections and sparse integration pages.',
      'FAQ schema was present, so adding more FAQ schema was not the right recommendation.',
      'Security and compliance claims lacked a stable source page that an AI answer could cite.',
    ],
    fixes: [
      'Create source-worthy pages for security, integrations, use cases, and implementation requirements.',
      'Add SoftwareApplication and Organization schema where it reflects visible page content.',
      'Move key product claims into crawlable HTML and link them from the sitemap and llms.txt.',
    ],
  },
  {
    id: 'ecommerce',
    label: 'Ecommerce Store',
    icon: ShoppingCart,
    context: 'An anonymized specialty ecommerce site with useful product detail pages but incomplete policy and product metadata.',
    found: [
      'Product pages had clear titles and images, but several lacked Product schema with price, availability, and review fields.',
      'Shipping, return, and warranty policies were present but hard to reach from product pages.',
      'Answer readiness was strongest on category pages and weakest on comparison and care-guide content.',
    ],
    fixes: [
      'Add Product schema that matches visible product details and avoid hidden or unsupported values.',
      'Link policy pages from product templates and include concise policy summaries near buying decisions.',
      'Create buying guide pages that answer fit, compatibility, material, maintenance, and comparison questions.',
    ],
  },
  {
    id: 'consultant',
    label: 'Independent Consultant',
    icon: Briefcase,
    context: 'An anonymized advisory business with expert content but unclear packaging and limited entity evidence.',
    found: [
      'Articles showed expertise, but the homepage did not quickly explain the consultant role, audience, or engagement model.',
      'Author details were available on some posts, yet there was no single profile page tying credentials, topics, and services together.',
      'The contact path was visible, but proof such as outcomes, industries, and methodology was scattered across the site.',
    ],
    fixes: [
      'Create a detailed profile page with credentials, services, methodology, topics, and contact paths.',
      'Add Person, Organization, Article, and Service schema where each type is supported by visible content.',
      'Turn case examples into concise source pages with problem, method, result, and constraints.',
    ],
  },
  {
    id: 'cybersecurity',
    label: 'Cybersecurity Provider',
    icon: LockKeyhole,
    context: 'An anonymized cybersecurity company with strong technical language but missing evidence for sensitive trust claims.',
    found: [
      'Crawler access was healthy and metadata was complete, but the site relied on broad security claims without enough supporting detail.',
      'Service pages named capabilities but did not explain assessment scope, deliverables, credentials, or response expectations.',
      'The site lacked a clear trust center, making it harder for answer engines to cite policies, compliance posture, and responsible disclosure details.',
    ],
    fixes: [
      'Create a trust center with security policy, disclosure process, compliance context, and contact escalation details.',
      'Rewrite service pages around buyer questions such as scope, timeline, evidence handling, and deliverables.',
      'Add Organization, Service, FAQPage, and Article schema tied to crawlable content and stable URLs.',
    ],
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are these real customer audits?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. These are anonymized examples based on common scan patterns. They show how evidence-based findings and fixes are structured without exposing private customer data.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use these examples as a checklist?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. The examples show common crawl access, entity clarity, answer readiness, citation likelihood, and trust evidence issues that teams can review on their own sites.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get a report for my site?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Run the free public scan on this page. AIVO will fetch public evidence from your site and return a shareable report with scores, findings, recommendations, and answer simulations.',
      },
    },
  ],
};

export default function SampleAudits() {
  const siteUrl = SITE.url.replace(/\/$/, '');

  return (
    <MarketingLayout>
      <SEOHead
        title="Sample AI Visibility Audits | AIVO Insights"
        description="Review anonymized AIVO sample audits for local services, SaaS, ecommerce, consultants, and cybersecurity websites."
        canonical={`${siteUrl}/sample-audits`}
        ogTitle="Sample AI Visibility Audits | AIVO Insights"
        ogDescription="See what AIVO finds and what to fix first across common website types."
        ogImage={`${siteUrl}/og-image.png`}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article>
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase text-blue-200">Sample reports</p>
              <h1 className="mt-4 text-4xl font-bold sm:text-5xl">Sample AI Visibility Audits</h1>
              <p className="mt-5 text-lg text-slate-200">
                See how AIVO turns crawl evidence into practical fixes for different website types. These examples are
                anonymized and focus on the kind of findings a team can act on quickly.
              </p>
            </div>
            <div className="mt-10">
              <PublicScanForm />
            </div>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-8">
              {samples.map((sample) => {
                const Icon = sample.icon;
                return (
                  <section key={sample.id} id={sample.id} className="rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Icon className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-gray-950">{sample.label}</h2>
                        <p className="mt-2 leading-7 text-gray-700">{sample.context}</p>
                      </div>
                    </div>
                    <div className="mt-6 grid gap-6 lg:grid-cols-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-950">What we found</h3>
                        <ul className="mt-3 space-y-3">
                          {sample.found.map((item) => (
                            <li key={item} className="flex gap-3 text-gray-700">
                              <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-blue-700" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-950">What to fix first</h3>
                        <ul className="mt-3 space-y-3">
                          {sample.fixes.map((item) => (
                            <li key={item} className="flex gap-3 text-gray-700">
                              <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-emerald-700" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </section>
      </article>
    </MarketingLayout>
  );
}
