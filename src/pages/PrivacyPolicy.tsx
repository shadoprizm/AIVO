import MarketingLayout from '../components/layouts/MarketingLayout';
import SEOHead from '../components/shared/SEOHead';
import { SITE } from '../config/site';

export default function PrivacyPolicy() {
  const siteUrl = SITE.url.replace(/\/$/, '');
  const privacyEmail = `privacy@${SITE.domain}`;

  return (
    <MarketingLayout>
      <SEOHead
        title="Privacy Policy | AIVO Insights"
        description="Learn about AIVO Insights' privacy practices, data collection, usage, security measures, and your rights regarding personal information."
        canonical={`${siteUrl}/privacy`}
        ogTitle="Privacy Policy - AIVO Insights"
        ogDescription="Our commitment to protecting your privacy and data security."
        ogImage={`${siteUrl}/og-image.png`}
      />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: January 18, 2025</p>

        <div className="prose prose-lg max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Introduction</h2>
            <p className="text-gray-700 leading-relaxed">
              AIVO Insights is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website analysis service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Account Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Email address</li>
              <li>Password (encrypted and never stored in plain text)</li>
              <li>Account creation date</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Website Data</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              When you add websites for analysis, we collect:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Website URLs you submit for scanning</li>
              <li>Website names you provide</li>
              <li>Public HTML content from the URLs you submit</li>
              <li>Scan results and AIVO Scores</li>
              <li>Analysis data including recommendations and insights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">Automatically Collected Information</h3>
            <p className="text-gray-700 leading-relaxed mb-4">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Browser type and version</li>
              <li>Device information</li>
              <li>IP address</li>
              <li>Usage patterns and interactions with our service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>Provide and maintain our website analysis service</li>
              <li>Process and analyze the websites you submit</li>
              <li>Generate AIVO Scores and recommendations</li>
              <li>Improve our analysis algorithms and service quality</li>
              <li>Communicate with you about your account and scans</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Sharing and Disclosure</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Service Providers:</strong> We use Supabase for database hosting and authentication, and OpenAI for AI-powered analysis. These providers process data on our behalf under strict confidentiality agreements.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information if required by law, court order, or governmental request.</li>
              <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Third-Party Services</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Supabase:</strong> Database hosting and authentication services</li>
              <li><strong>OpenAI:</strong> AI-powered website analysis and recommendations</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              When you use our service, publicly accessible HTML content from the websites you submit is sent to OpenAI for analysis. This data is processed according to OpenAI's data usage policies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Security</h2>
            <p className="text-gray-700 leading-relaxed">
              We implement appropriate technical and organizational measures to protect your information, including encryption, secure authentication, and access controls. However, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Data Retention</h2>
            <p className="text-gray-700 leading-relaxed">
              We retain your account information and scan data for as long as your account is active. If you delete your account, we will delete or anonymize your personal information within 30 days, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li><strong>Access:</strong> Request access to your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Data Portability:</strong> Request a copy of your data in a structured format</li>
              <li><strong>Opt-Out:</strong> Opt out of certain data processing activities</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mt-4">
              To exercise these rights, please contact us at the email address below.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookies</h2>
            <p className="text-gray-700 leading-relaxed">
              We use essential cookies for authentication and session management. These cookies are necessary for the service to function and cannot be disabled. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-700 leading-relaxed">
              Our service is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">International Data Transfers</h2>
            <p className="text-gray-700 leading-relaxed">
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Privacy Policy</h2>
            <p className="text-gray-700 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <p className="text-gray-700 leading-relaxed mt-4">
              Email: <a href={`mailto:${privacyEmail}`} className="text-blue-600 hover:text-blue-700">{privacyEmail}</a>
            </p>
          </section>
        </div>
      </div>
    </MarketingLayout>
  );
}
