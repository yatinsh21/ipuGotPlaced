import Navbar from '@/components/Navbar';
import { Mail, MessageSquare, Clock, MapPin } from 'lucide-react';

const ContactPage = () => {
  return (
    <>
    <Navbar/>
    
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-lg text-gray-600">
            Have questions? We're here to help
          </p>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Email Card */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-900 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Mail className="h-6 w-6 text-blue-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Email Us</h3>
            </div>
            <p className="text-gray-600 mb-3">
              For general inquiries, support, or feedback
            </p>
            <a 
              href="mailto:info.ipugotplaced@gmail.com"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              info.ipugotplaced@gmail.com
            </a>
          </div>

          {/* Support Card */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-900 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Support</h3>
            </div>
            <p className="text-gray-600 mb-3">
              Need help with your premium access or payment?
            </p>
            <a 
              href="mailto:info.ipugotplaced@gmail.com"
              className="text-green-600 hover:text-green-800 font-medium"
            >
              Contact Support
            </a>
          </div>

          {/* Response Time */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Response Time</h3>
            </div>
            <p className="text-gray-600">
              We typically respond within 24-48 hours on business days
            </p>
          </div>

          {/* Location */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <MapPin className="h-6 w-6 text-yellow-700" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Based In</h3>
            </div>
            <p className="text-gray-600">
              India
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sm:p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
           <div>
  <h3 className="font-semibold text-gray-900 mb-2">How do I access premium content?</h3>
  <p className="text-gray-600 text-sm">
    After signing in, visit any company questions page or interview experience. Click{" "}
    <span className="font-medium text-gray-900">"Upgrade to Premium"</span> and complete the one-time payment of{" "}
    <span className="line-through text-gray-500">₹399</span>{" "}
    <span className="font-semibold text-green-600">₹299</span> through Razorpay.
  </p>
</div>


            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is the payment secure?</h3>
              <p className="text-gray-600 text-sm">
                Yes, all payments are processed through Razorpay, India's leading payment gateway with bank-level security and encryption.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I get a refund?</h3>
              <p className="text-gray-600 text-sm">
                Due to the digital nature of our content, refunds are handled on a case-by-case basis. Please contact support with your concern.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How often is content updated?</h3>
              <p className="text-gray-600 text-sm">
                We regularly update our question bank and interview experiences based on recent interviews and feedback from our community.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Can I share my premium access?</h3>
              <p className="text-gray-600 text-sm">
                Premium access is tied to your individual account and is non-transferable. Sharing credentials violates our terms of service.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-gray-900 text-white rounded-lg p-6 text-center">
          <p className="text-lg font-semibold mb-2">Still have questions?</p>
          <p className="text-gray-300 text-sm">
            Email us at <a href="mailto:info.ipugotplaced@gmail.com" className="text-blue-400 hover:text-blue-300">info.ipugotplaced@gmail.com</a> and we'll get back to you as soon as possible.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default ContactPage;