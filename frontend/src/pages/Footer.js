import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t-2 border-gray-200 bg-white py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Logo / Brand */}
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-3">
              <img 
                src="/igp.png" 
                alt="IPU Got Placed" 
                className="h-8 w-8 object-contain"
              />
              <span className="text-gray-900 font-bold text-lg">IPU Got Placed</span>
            </div>
            <p className="text-sm text-gray-600">
              Your trusted platform for interview preparation and placement success.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Quick Links</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <Link to="/topics" className="hover:text-gray-900 transition-colors">Free Questions</Link>
              <Link to="/goldmine" className="hover:text-gray-900 transition-colors">Premium Content</Link>
              <Link to="/experiences" className="hover:text-gray-900 transition-colors">Interview Experiences</Link>
              <Link to="/alumni" className="hover:text-gray-900 transition-colors">Alumni Connect</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Company</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <Link to="/about" className="hover:text-gray-900 transition-colors">About Us</Link>
              <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
              <Link to="/faq" className="hover:text-gray-900 transition-colors">FAQ</Link>
            </div>
          </div>

          {/* Legal - PROMINENT */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide">Legal & Policies</h3>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              <Link to="/privacy" className="hover:text-gray-900 transition-colors font-medium">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-gray-900 transition-colors font-medium">Terms of Service</Link>
              <Link to="/refund-policy" className="hover:text-gray-900 transition-colors font-medium">Refund Policy</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} IPU Got Placed. All rights reserved.
          </p>
          
          {/* Contact Email */}
          <a 
            href="mailto:info.ipugotplaced@gmail.com" 
            className="text-xs text-gray-600 hover:text-gray-900 transition-colors"
          >
            info.ipugotplaced@gmail.com
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer