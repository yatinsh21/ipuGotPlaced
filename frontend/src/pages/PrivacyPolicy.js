import React from 'react'
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const PrivacyPage = () => {
  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last Updated: October 31, 2025
          </p>

          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Introduction</h2>
              <p className="leading-relaxed">
                IPUGotPlaced ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Platform at ipugotplaced.in.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google Account Information:</strong> When you sign in with Google, we collect your name, email address, and profile picture</li>
                <li><strong>Payment Information:</strong> Payment details are processed securely by Razorpay. We do not store your credit/debit card information</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> Pages visited, time spent, features used</li>
                <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
                <li><strong>Cookies:</strong> We use cookies to maintain your session and improve user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
              <p className="leading-relaxed mb-2">We use collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain the Platform</li>
                <li>Process your premium subscription payments</li>
                <li>Authenticate your identity and manage your account</li>
                <li>Send service-related notifications</li>
                <li>Improve and personalize user experience</li>
                <li>Analyze usage patterns and Platform performance</li>
                <li>Prevent fraud and ensure security</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Information Sharing and Disclosure</h2>
              <p className="leading-relaxed mb-2">We do not sell your personal information. We may share information with:</p>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.1 Service Providers</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Google (Clerk):</strong> For authentication services</li>
                <li><strong>Razorpay:</strong> For payment processing</li>
                <li><strong>Hosting Providers:</strong> For Platform infrastructure</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">4.2 Legal Requirements</h3>
              <p className="leading-relaxed">
                We may disclose your information if required by law, court order, or to protect our rights, safety, or property.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Data Security</h2>
              <p className="leading-relaxed mb-2">
                We implement appropriate security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data in transit using HTTPS/SSL</li>
                <li>Secure authentication through Google OAuth</li>
                <li>Secure payment processing through Razorpay (PCI-DSS compliant)</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
              </ul>
              <p className="leading-relaxed mt-3">
                However, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide services. If you wish to delete your account, please contact us at info.ipugotplaced@gmail.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
              <p className="leading-relaxed mb-2">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Request your data in a portable format</li>
              </ul>
              <p className="leading-relaxed mt-3">
                To exercise these rights, contact us at info.ipugotplaced@gmail.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Cookies and Tracking</h2>
              <p className="leading-relaxed mb-2">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintain your login session</li>
                <li>Remember your preferences</li>
                <li>Analyze Platform usage and performance</li>
                <li>Provide personalized content</li>
              </ul>
              <p className="leading-relaxed mt-3">
                You can control cookies through your browser settings, but disabling cookies may affect Platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">8.1 Third-Party Advertising</h2>
              <p className="leading-relaxed mb-2">
                We use third-party advertising services, including Google AdSense, to display advertisements on our Platform. These services may use cookies, web beacons, and similar technologies to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Serve ads based on your prior visits to our website or other websites</li>
                <li>Display personalized advertisements relevant to your interests</li>
                <li>Measure the effectiveness of their advertising campaigns</li>
                <li>Prevent fraudulent activity and improve ad security</li>
              </ul>
              <p className="leading-relaxed mt-3">
                <strong>Google AdSense:</strong> Google and its partners use cookies to serve ads based on your visit to our site and other sites on the Internet. You may opt out of personalized advertising by visiting{' '}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline">
                  Google Ads Settings
                </a>{' '}
                or{' '}
                <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline">
                  www.aboutads.info
                </a>.
              </p>
              <p className="leading-relaxed mt-3">
                Third-party vendors and ad networks may also display ads on our site. For more information about how Google uses data when you use our partners' sites or apps, please visit{' '}
                <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium underline">
                  Google's Privacy & Terms
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Third-Party Links</h2>
              <p className="leading-relaxed">
                Our Platform may contain links to third-party websites. We are not responsible for the privacy practices of these websites. We encourage you to read their privacy policies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our Platform is intended for users aged 16 and above. We do not knowingly collect information from children under 16. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">11. International Data Transfers</h2>
              <p className="leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Changes to Privacy Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">13. Contact Us</h2>
              <p className="leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-3 pl-4">
                <p className="leading-relaxed">
                  <strong>Email:</strong> <a href="mailto:info.ipugotplaced@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">info.ipugotplaced@gmail.com</a>
                </p>
                <p className="leading-relaxed">
                  <strong>Website:</strong> <a href="https://ipugotplaced.in" className="text-blue-600 hover:text-blue-800 font-medium">ipugotplaced.in</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">14. Consent</h2>
              <p className="leading-relaxed">
                By using IPUGotPlaced, you consent to the collection and use of information as described in this Privacy Policy.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Your privacy is important to us. If you have any concerns, please don't hesitate to reach out.
            </p>
          </div>
        </div>
      </div>
    </div>
    {/* <Footer/> */}
    </>
  );
};

export default PrivacyPage;