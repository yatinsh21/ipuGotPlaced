import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const TermsPage = () => {
  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sm:p-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Terms and Conditions
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Last Updated: October 31, 2025
          </p>

          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using IPUGotPlaced ("the Platform"), you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="leading-relaxed mb-2">
                IPUGotPlaced provides:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Free topic-wise interview questions</li>
                <li>Premium interview experiences from successful candidates</li>
                <li>Premium company-wise curated question banks</li>
                <li>Interview preparation resources</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">3. User Accounts</h2>
              <p className="leading-relaxed mb-2">
                <strong>3.1 Registration:</strong> You must sign in using Google authentication to access certain features.
              </p>
              <p className="leading-relaxed mb-2">
                <strong>3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
              <p className="leading-relaxed">
                <strong>3.3 Account Sharing:</strong> Premium accounts are personal and non-transferable. Sharing account credentials is strictly prohibited and may result in account termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Premium Subscription</h2>
              <p className="leading-relaxed mb-2">
                <strong>4.1 Payment:</strong> Premium access requires a one-time payment of ₹399 processed through Razorpay.
              </p>
              <p className="leading-relaxed mb-2">
                <strong>4.2 Lifetime Access:</strong> Premium subscription provides lifetime access to all premium content, including interview experiences and company-wise questions.
              </p>
              <p className="leading-relaxed mb-2">
                <strong>4.3 Non-Refundable:</strong> Due to the digital nature of our content, all payments are generally non-refundable. Refund requests will be evaluated on a case-by-case basis.
              </p>
              <p className="leading-relaxed">
                <strong>4.4 Price Changes:</strong> We reserve the right to modify pricing for new users. Existing premium users will not be affected by price changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Content Usage</h2>
              <p className="leading-relaxed mb-2">
                <strong>5.1 Intellectual Property:</strong> All content on IPUGotPlaced, including questions, experiences, and resources, is protected by copyright and intellectual property laws.
              </p>
              <p className="leading-relaxed mb-2">
                <strong>5.2 Permitted Use:</strong> Content is for personal, non-commercial use only. You may not reproduce, distribute, or sell any content from the Platform.
              </p>
              <p className="leading-relaxed">
                <strong>5.3 Prohibited Actions:</strong> You may not copy, scrape, download in bulk, or redistribute content from the Platform in any form.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">6. User Conduct</h2>
              <p className="leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Platform for any illegal purposes</li>
                <li>Share your premium account credentials with others</li>
                <li>Attempt to circumvent payment or access controls</li>
                <li>Upload malicious code or engage in hacking activities</li>
                <li>Misrepresent your identity or affiliation</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Content Accuracy</h2>
              <p className="leading-relaxed">
                While we strive to provide accurate and up-to-date information, IPUGotPlaced does not guarantee the accuracy, completeness, or reliability of any content. Interview questions and experiences are contributed by users and may not reflect current interview processes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                The Platform is provided "as is" without warranties of any kind, either express or implied. IPUGotPlaced does not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p className="leading-relaxed">
                IPUGotPlaced shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Platform, including but not limited to interview outcomes or employment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Account Termination</h2>
              <p className="leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violation of these Terms, suspicious activity, or any other reason at our sole discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Modifications to Terms</h2>
              <p className="leading-relaxed">
                IPUGotPlaced reserves the right to modify these Terms at any time. Continued use of the Platform after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">13. Contact Information</h2>
              <p className="leading-relaxed">
                For questions about these Terms, please contact us at:
                <br />
                <a href="mailto:info.ipugotplaced@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">
                  info.ipugotplaced@gmail.com
                </a>
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t-2 border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              By using IPUGotPlaced, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
    <Footer/>
    </>

  );
};

export default TermsPage;