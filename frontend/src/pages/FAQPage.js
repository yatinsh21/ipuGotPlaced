import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search } from 'lucide-react';

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const faqCategories = [
    {
      category: 'General Questions',
      questions: [
        {
          q: 'What is IPUGotPlaced?',
          a: 'IPUGotPlaced (IGP) is a comprehensive interview preparation platform designed specifically for GGSIPU students. We provide topic-wise interview questions, company-specific question banks, real interview experiences, and alumni connections to help you crack your dream job interviews.'
        },
        {
          q: 'Is IPUGotPlaced free to use?',
          a: 'Yes! We offer free access to topic-wise interview questions covering DSA, algorithms, system design, and more. Premium features like company-specific questions, interview experiences, and alumni contact details are available with a one-time payment of ₹299 (originally ₹399).'
        },
        {
          q: 'Who can use IPUGotPlaced?',
          a: 'While primarily designed for GGSIPU students, anyone preparing for technical interviews can use our platform. Our content is particularly relevant for students targeting campus placements and entry-level software engineering positions.'
        },
        {
          q: 'How is IPUGotPlaced different from other platforms?',
          a: 'Unlike generic platforms, IPUGotPlaced focuses on companies that actively recruit from IPU colleges. Our content is curated from real interview experiences of IPU students, making it highly relevant and targeted for your preparation needs.'
        }
      ]
    },
    {
      category: 'Account & Authentication',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Simply click on the "Sign In" button in the navigation bar. We use Google authentication for secure and easy sign-in. You can sign in with your Google account, and your account will be created automatically.'
        },
        {
          q: 'Why do I need to sign in?',
          a: 'Signing in allows you to bookmark questions, track your progress, access premium content (if subscribed), and receive personalized recommendations based on your preparation journey.'
        },
        {
          q: 'Is my data secure?',
          a: 'Absolutely! We use industry-standard Google OAuth authentication and secure HTTPS encryption. We do not store your password, and all data transmission is encrypted. Read our Privacy Policy for detailed information.'
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can request account deletion by emailing us at info.ipugotplaced@gmail.com. We will process your request within 7 business days and delete all your personal information as per our data retention policy.'
        }
      ]
    },
    {
      category: 'Premium Subscription',
      questions: [
        {
          q: 'What is included in the Premium subscription?',
          a: 'Premium subscription (₹299 lifetime) includes: (1) Company-wise curated question banks from top recruiters, (2) Full access to detailed interview experiences from successful candidates, (3) Alumni contact details for networking and mentorship, (4) Priority access to new features and content, (5) Bookmark unlimited questions across all categories.'
        },
        {
          q: 'How much does Premium cost?',
          a: 'Premium subscription is available at a special discounted price of ₹299 (originally ₹399). This is a one-time payment for lifetime access - no recurring charges, no hidden fees, no monthly subscriptions.'
        },
        {
          q: 'How do I upgrade to Premium?',
          a: 'After signing in, visit any company questions page or interview experience. Click the "Upgrade to Premium" button, and complete the secure payment through Razorpay. Your premium access will be activated instantly upon successful payment.'
        },
        {
          q: 'What payment methods are accepted?',
          a: 'We accept all major payment methods through Razorpay including credit cards, debit cards, UPI, net banking, and digital wallets (Paytm, PhonePe, Google Pay). All payments are processed securely with bank-level encryption.'
        },
        {
          q: 'Is it a one-time payment or subscription?',
          a: 'It is a one-time payment of ₹299 for lifetime access. There are no recurring charges, auto-renewals, or subscription fees. Once you pay, you have permanent access to all premium features.'
        },
        {
          q: 'Can I share my Premium account?',
          a: 'No. Premium accounts are personal and non-transferable. Sharing credentials violates our Terms of Service and may result in account suspension. Each user should have their own individual account.'
        },
        {
          q: 'Will Premium price increase in the future?',
          a: 'We may adjust pricing for new users, but existing Premium subscribers will always retain their access regardless of future price changes. Your investment is protected!'
        }
      ]
    },
    {
      category: 'Content & Features',
      questions: [
        {
          q: 'How many questions are available?',
          a: 'We have over 1000+ curated interview questions across various topics including Data Structures, Algorithms, System Design, Operating Systems, DBMS, and more. The question bank is continuously updated with new content.'
        },
        {
          q: 'Are the questions from real interviews?',
          a: 'Yes! All company-specific questions in our premium section are sourced from actual interviews conducted by these companies at IPU colleges. They are verified and contributed by students who appeared in those interviews.'
        },
        {
          q: 'How often is content updated?',
          a: 'We update our question banks and interview experiences weekly based on recent campus recruitment drives and feedback from our community. Premium subscribers get early access to new content.'
        },
        {
          q: 'Can I bookmark questions?',
          a: 'Yes! Signed-in users can bookmark questions for quick access later. All your bookmarks are saved in your account and accessible from the Bookmarks page.'
        },
        {
          q: 'What companies are covered?',
          a: 'We cover all major companies that actively recruit from IPU colleges including TCS, Cvent, IVP, TTN, Google, Microsoft, Amazon, Flipkart, and many more. The list is constantly expanding.'
        },
        {
          q: 'What is Project Interview Prep?',
          a: 'Project Interview Prep is an AI-powered feature that generates custom interview questions based on your specific project and tech stack. It helps you prepare for project-related questions that recruiters commonly ask.'
        },
        {
          q: 'What is Alumni Connect?',
          a: 'Alumni Connect allows you to search and connect with IPU alumni working at companies you are targeting. Premium users can access full contact details (email and phone) to reach out for mentorship and guidance.'
        }
      ]
    },
    {
      category: 'Payment & Refunds',
      questions: [
        {
          q: 'Is the payment secure?',
          a: 'Yes, absolutely! All payments are processed through Razorpay, India\'s leading payment gateway with PCI-DSS Level 1 compliance. We do not store any credit/debit card information. Your payment details are encrypted and secure.'
        },
        {
          q: 'What if my payment fails?',
          a: 'If your payment fails, please try again after some time. Ensure you have sufficient balance and your bank allows online transactions. If the problem persists, contact us at info.ipugotplaced@gmail.com with your transaction details.'
        },
        {
          q: 'I was charged but didn\'t get Premium access. What should I do?',
          a: 'Don\'t worry! Sometimes there might be a delay in payment confirmation. Wait for 10-15 minutes and refresh the page. If the issue persists, email us immediately at info.ipugotplaced@gmail.com with your payment screenshot and order ID.'
        },
        {
          q: 'Can I get a refund?',
          a: 'Due to the instant digital nature of our content, refunds are generally not provided. However, we handle genuine cases (technical issues, duplicate payments, service errors) on a case-by-case basis within 7 days of purchase. Read our detailed Refund Policy for complete information.'
        },
        {
          q: 'Do you provide invoices/receipts?',
          a: 'Yes! A payment receipt is automatically sent to your registered email after successful payment. You can also download the invoice from your Razorpay payment confirmation page.'
        }
      ]
    },
    {
      category: 'Technical Support',
      questions: [
        {
          q: 'I can\'t access certain features. What should I do?',
          a: 'First, ensure you are signed in and have the necessary access (Premium subscription if applicable). Try clearing your browser cache and cookies, or try a different browser. If the issue persists, contact our support team.'
        },
        {
          q: 'The website is not loading properly',
          a: 'Please check your internet connection and try refreshing the page. Clear your browser cache, disable ad blockers temporarily, and ensure you are using an updated browser (Chrome, Firefox, Safari, or Edge recommended).'
        },
        {
          q: 'I forgot my password',
          a: 'We use Google authentication, so you don\'t need a separate password for IPUGotPlaced. Simply sign in with your Google account. If you have issues with your Google account, visit Google\'s account recovery page.'
        },
        {
          q: 'Can I use IPUGotPlaced on mobile?',
          a: 'Yes! Our website is fully responsive and works seamlessly on all devices including smartphones, tablets, and desktops. We recommend using mobile browsers like Chrome or Safari for the best experience.'
        },
        {
          q: 'Why can\'t I copy questions?',
          a: 'To protect our content from unauthorized distribution, we have disabled copying, right-click, and keyboard shortcuts. This ensures the content remains exclusive and valuable for our community. You can still bookmark questions for easy access.'
        }
      ]
    },
    {
      category: 'Privacy & Legal',
      questions: [
        {
          q: 'How do you use my personal data?',
          a: 'We collect minimal personal information (name, email from Google sign-in) to provide our services. We do not sell your data to third parties. Your information is used solely for account management, service delivery, and communication. Read our Privacy Policy for complete details.'
        },
        {
          q: 'Do you use cookies?',
          a: 'Yes, we use cookies to maintain your login session, remember your preferences, and analyze website usage for improvements. You can manage cookie preferences through our cookie consent banner or browser settings.'
        },
        {
          q: 'Is my payment information stored?',
          a: 'No! We do not store any payment information. All payment processing is handled by Razorpay with bank-level security. We only receive payment confirmation, not your card/bank details.'
        },
        {
          q: 'Who owns the content on IPUGotPlaced?',
          a: 'All content on IPUGotPlaced is protected by copyright and intellectual property laws. The content is for personal, non-commercial use only. Reproduction, distribution, or commercial use is strictly prohibited.'
        }
      ]
    },
    {
      category: 'Community & Support',
      questions: [
        {
          q: 'How can I contribute interview questions?',
          a: 'We welcome contributions from the community! If you have recently appeared for an interview and want to share questions or experiences, please email us at info.ipugotplaced@gmail.com with detailed information. Valuable contributions may be featured on our platform.'
        },
        {
          q: 'I found incorrect information. How do I report it?',
          a: 'We appreciate your vigilance! Please report any errors or inaccuracies by emailing us at info.ipugotplaced@gmail.com with the specific question/content and the correction. We review all reports and update content promptly.'
        },
        {
          q: 'How do I contact support?',
          a: 'You can reach our support team by emailing info.ipugotplaced@gmail.com. We typically respond within 24-48 hours on business days. Please include your registered email and detailed description of your issue for faster resolution.'
        },
        {
          q: 'Do you have a mobile app?',
          a: 'Currently, we do not have a dedicated mobile app. However, our website is fully mobile-responsive and provides an excellent experience on all devices. A mobile app is in our future roadmap!'
        },
        {
          q: 'Can I suggest new features?',
          a: 'Absolutely! We love hearing from our community. Send your feature suggestions to info.ipugotplaced@gmail.com. We carefully review all suggestions and prioritize those that benefit the majority of our users.'
        }
      ]
    }
  ];

  const filteredFAQs = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      faq =>
        faq.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about IPUGotPlaced
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none"
              />
            </div>
          </div>

          {/* FAQ Sections */}
          {filteredFAQs.length > 0 ? (
            <div className="space-y-8">
              {filteredFAQs.map((category, idx) => (
                <div key={idx} className="bg-white border-2 border-gray-200 rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {category.category}
                  </h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((faq, faqIdx) => (
                      <AccordionItem key={faqIdx} value={`item-${idx}-${faqIdx}`}>
                        <AccordionTrigger className="text-left font-semibold text-gray-900 hover:text-gray-700">
                          {faq.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-gray-700 leading-relaxed">
                          {faq.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">
                No questions found matching "{searchTerm}". Try different keywords.
              </p>
            </div>
          )}

          {/* Contact Section */}
          <div className="mt-12 bg-gray-900 text-white rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-gray-300 mb-4">
              Can't find what you're looking for? We're here to help!
            </p>
            <a
              href="mailto:info.ipugotplaced@gmail.com"
              className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQPage;
