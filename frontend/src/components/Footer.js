import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t border-gray-200 bg-white py-8 md:py-10">
  <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
    {/* Logo / Brand */}
    <div className="flex items-center gap-2">
      <img 
        src="/igp.png" 
        alt="IPU Got Placed" 
        className="h-8 w-8 object-contain"
      />
      <span className="text-gray-900 font-semibold text-lg">IPU Got Placed</span>
    </div>

    {/* Links */}
    <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
      <Link to="/topics" className="hover:text-gray-900 transition-colors">Topics</Link>
      <Link to="/goldmine" className="hover:text-gray-900 transition-colors">Company Prep</Link>
      <Link to="/experiences" className="hover:text-gray-900 transition-colors">Experiences</Link>
      <Link to="/about" className="hover:text-gray-900 transition-colors">About</Link>
      <Link to="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
    </div>

    {/* Copyright */}
    <p className="text-xs text-gray-500 text-center md:text-right">
      © {new Date().getFullYear()} IPU Got Placed. All rights reserved.
    </p>
  </div>
</footer>
  )
}

export default Footer