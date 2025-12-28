import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RefundPolicy = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sm:p-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              Refund and Cancellation Policy
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              Last Updated: January 15, 2025
            </p>

            <div className="prose max-w-none space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Overview</h2>
                <p className="leading-relaxed">
                  At IPUGotPlaced, we strive to provide high-quality interview preparation content and services. 
                  This Refund and Cancellation Policy outlines the terms and conditions for refunds and cancellations 
                  of our premium subscription services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Premium Subscription Details</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Subscription Type:</strong> One-time lifetime payment</li>
                  <li><strong>Current Price:</strong> ₹299 (Original Price: ₹399)</li>
                  <li><strong>Payment Method:</strong> Processed through Razorpay</li>
                  <li><strong>Access Duration:</strong> Lifetime access to all premium content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. Refund Policy</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.1 General Policy</h3>
                <p className="leading-relaxed">
                  Due to the instant digital nature of our premium content (immediate access to interview questions, 
                  experiences, and company-wise preparation materials), all sales are generally considered final. 
                  However, we understand that exceptional circumstances may arise.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.2 Eligible Refund Scenarios</h3>
                <p className="leading-relaxed mb-2">Refunds may be considered in the following cases:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Technical Issues:</strong> If you are unable to access premium content due to technical 
                  problems on our end that we cannot resolve within 7 days of reporting</li>
                  <li><strong>Duplicate Payment:</strong> If you were accidentally charged multiple times for the 
                  same subscription</li>
                  <li><strong>Payment Processing Errors:</strong> If there was an error in payment processing that 
                  resulted in incorrect charges</li>
                  <li><strong>Service Not as Described:</strong> If the premium content significantly differs from 
                  what was advertised (must be reported within 7 days of purchase with specific evidence)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.3 Non-Eligible Refund Scenarios</h3>
                <p className="leading-relaxed mb-2">Refunds will NOT be provided in the following cases:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Change of mind after accessing premium content</li>
                  <li>Failure to use the premium subscription after purchase</li>
                  <li>User's inability to understand or use the platform features</li>
                  <li>Request made more than 7 days after purchase date</li>
                  <li>Requests from users who have violated our Terms of Service</li>
                  <li>Account sharing or credential misuse violations</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">3.4 Refund Request Timeline</h3>
                <p className="leading-relaxed">
                  All refund requests must be submitted within <strong>7 days</strong> of the purchase date. 
                  Requests received after this period will not be considered under any circumstances.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. How to Request a Refund</h2>
                <p className="leading-relaxed mb-2">
                  If you believe you qualify for a refund based on the eligible scenarios above, please follow these steps:
                </p>
                <ol className="list-decimal pl-6 space-y-3">
                  <li>
                    <strong>Contact Support:</strong> Email us at{' '}
                    <a href="mailto:info.ipugotplaced@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">
                      info.ipugotplaced@gmail.com
                    </a>{' '}
                    with the subject line "Refund Request"
                  </li>
                  <li>
                    <strong>Provide Details:</strong> Include the following information:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Your registered email address</li>
                      <li>Order ID or payment transaction ID</li>
                      <li>Date of purchase</li>
                      <li>Detailed reason for refund request with supporting evidence</li>
                      <li>Screenshots (if applicable) demonstrating technical issues</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Wait for Review:</strong> Our team will review your request within 5-7 business days
                  </li>
                  <li>
                    <strong>Decision Notification:</strong> You will receive an email notification regarding the 
                    approval or denial of your refund request
                  </li>
                </ol>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Refund Processing</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.1 Approved Refunds</h3>
                <p className="leading-relaxed mb-2">If your refund is approved:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>The refund will be processed to your original payment method</li>
                  <li>Processing time: 7-10 business days from approval date</li>
                  <li>Bank processing may take an additional 5-7 business days</li>
                  <li>You will receive a confirmation email once the refund is initiated</li>
                  <li>Your premium access will be immediately revoked</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">5.2 Partial Refunds</h3>
                <p className="leading-relaxed">
                  In certain exceptional cases, partial refunds may be offered at our sole discretion based on 
                  the extent of service usage and the nature of the issue.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Cancellation Policy</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">6.1 No Recurring Charges</h3>
                <p className="leading-relaxed">
                  Since IPUGotPlaced offers a one-time lifetime premium subscription, there are no recurring 
                  charges or automatic renewals. Therefore, no cancellation of recurring payments is necessary.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">6.2 Account Deletion</h3>
                <p className="leading-relaxed mb-2">
                  If you wish to delete your account:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Contact us at info.ipugotplaced@gmail.com with your account deletion request</li>
                  <li>Account deletion does not automatically entitle you to a refund</li>
                  <li>Once deleted, your account and access cannot be recovered</li>
                  <li>Your personal data will be handled according to our Privacy Policy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Special Circumstances</h2>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">7.1 Medical or Personal Emergencies</h3>
                <p className="leading-relaxed">
                  We understand that life circumstances can change unexpectedly. If you have experienced a medical 
                  emergency, personal crisis, or other exceptional circumstances, please contact us with supporting 
                  documentation. We will review such cases with empathy and on a case-by-case basis.
                </p>

                <h3 className="text-xl font-semibold text-gray-900 mb-2 mt-4">7.2 Service Discontinuation</h3>
                <p className="leading-relaxed">
                  In the unlikely event that IPUGotPlaced discontinues its services entirely, active premium 
                  subscribers will be notified at least 30 days in advance and may be eligible for a pro-rated 
                  refund based on service usage.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Dispute Resolution</h2>
                <p className="leading-relaxed">
                  If you are unsatisfied with our refund decision, you may request a review by our senior 
                  management team. Please email your dispute to info.ipugotplaced@gmail.com with "Refund Dispute" 
                  in the subject line. We will conduct a final review within 10 business days.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Contact for Refund Queries</h2>
                <p className="leading-relaxed">
                  For any questions regarding our Refund and Cancellation Policy, please contact us at:
                </p>
                <div className="mt-3 pl-4">
                  <p className="leading-relaxed">
                    <strong>Email:</strong>{' '}
                    <a href="mailto:info.ipugotplaced@gmail.com" className="text-blue-600 hover:text-blue-800 font-medium">
                      info.ipugotplaced@gmail.com
                    </a>
                  </p>
                  <p className="leading-relaxed">
                    <strong>Subject Line:</strong> Refund Request / Refund Query
                  </p>
                  <p className="leading-relaxed">
                    <strong>Response Time:</strong> Within 5-7 business days
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
                <p className="leading-relaxed">
                  IPUGotPlaced reserves the right to modify this Refund and Cancellation Policy at any time. 
                  Changes will be posted on this page with an updated "Last Updated" date. Your continued use of 
                  the platform after changes constitutes acceptance of the modified policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Fair Use Commitment</h2>
                <p className="leading-relaxed">
                  At IPUGotPlaced, we are committed to treating all refund requests fairly and transparently. 
                  While we have guidelines in place, we understand that every situation is unique and will 
                  consider each request on its individual merits with empathy and understanding.
                </p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t-2 border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                We value your trust and strive to provide the best service possible. If you have any concerns, 
                please don't hesitate to reach out to us.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RefundPolicy;
