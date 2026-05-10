import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import { SITE } from '../config/site';

export default function TermsOfService() {
  const siteUrl = SITE.url.replace(/\/$/, '');
  const legalEmail = `legal@${SITE.domain}`;

  return (
    <MarketingLayout>
      <SEOHead
        title="Terms of Service | AIVO Insights"
        description="Read AIVO Insights' Terms of Service, including usage guidelines, user responsibilities, service limitations, and legal agreements."
        canonical={`${siteUrl}/terms`}
        ogTitle="Terms of Service - AIVO Insights"
        ogDescription="Terms and conditions for using AIVO Insights AI visibility analysis platform."
        ogImage={`${siteUrl}/og-image.png`}
      />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: January 18, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing or using AIVO Insights, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Description of Service</h2>
            <p className="text-gray-700 leading-relaxed">
              AIVO Insights is a website analysis tool that evaluates how well websites are optimized for AI language model visibility and understanding. The service provides AIVO Scores, category assessments, and recommendations to improve website content for AI discoverability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Account Registration</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              To use AIVO Insights, you must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Be at least 13 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized account access</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You may not use another person's account without permission or create multiple accounts to circumvent service limitations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Acceptable Use</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              You agree to use AIVO Insights only for lawful purposes. You may not:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Submit websites you do not own or have authorization to analyze</li>
              <li>Attempt to circumvent rate limits or service restrictions</li>
              <li>Use automated tools to abuse or overload the service</li>
              <li>Reverse engineer or attempt to extract the source code</li>
              <li>Interfere with the proper functioning of the service</li>
              <li>Use the service to harm, harass, or violate the rights of others</li>
              <li>Submit malicious content or attempt to compromise security</li>
              <li>Resell or redistribute the service without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Website Submissions</h2>
            <p className="text-gray-700 leading-relaxed">
              When you submit a website URL for analysis, you represent and warrant that you have the right to analyze that website. You acknowledge that AIVO Insights will access publicly available content from the submitted URLs and process that content using third-party AI services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Service Limitations</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              AIVO Insights imposes certain limitations on usage:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Maximum 5 scans per hour per website</li>
              <li>10-second timeout for website fetches</li>
              <li>100KB HTML content limit per scan</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              We reserve the right to modify these limitations at any time to ensure fair usage and service quality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed">
              All content, features, and functionality of AIVO Insights, including but not limited to text, graphics, logos, and software, are owned by AIVO Insights or its licensors and are protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works without explicit permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Analysis Results and Recommendations</h2>
            <p className="text-gray-700 leading-relaxed">
              AIVO Scores and recommendations are provided for informational purposes only. We make no guarantees about:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mt-4">
              <li>Accuracy or completeness of analysis results</li>
              <li>Improvement in AI visibility after implementing recommendations</li>
              <li>Rankings or citations by AI language models</li>
              <li>Business outcomes or website performance</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              You are solely responsible for evaluating and implementing any recommendations provided by the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service relies on third-party providers including Supabase for infrastructure and OpenAI for analysis. Your use of AIVO Insights is subject to the terms and availability of these third-party services. We are not responsible for any disruption, limitation, or issues caused by third-party providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Disclaimers and Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              AIVO Insights is provided "as is" without warranties of any kind, either express or implied, including but not limited to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Merchantability or fitness for a particular purpose</li>
              <li>Uninterrupted or error-free service</li>
              <li>Accuracy or reliability of results</li>
              <li>Security or freedom from viruses or harmful components</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To the fullest extent permitted by law, AIVO Insights shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to indemnify and hold harmless AIVO Insights, its affiliates, and their respective officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses arising out of your use of the service, violation of these Terms, or infringement of any third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to suspend or terminate your account at any time, with or without notice, for any reason, including but not limited to violation of these Terms. Upon termination, your right to use the service will immediately cease. You may delete your account at any time through the dashboard settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to Service and Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or discontinue the service, temporarily or permanently, with or without notice. We may also update these Terms of Service at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Governing Law and Dispute Resolution</h2>
            <p className="text-gray-700 leading-relaxed">
              These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law principles. Any disputes arising from these Terms or your use of the service shall be resolved through binding arbitration, except where prohibited by law.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Severability</h2>
            <p className="text-gray-700 leading-relaxed">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Email: <a href={`mailto:${legalEmail}`} className="text-blue-600 hover:text-blue-700">{legalEmail}</a>
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
