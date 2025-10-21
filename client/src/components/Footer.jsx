import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Twitter, MapPin, Phone, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 py-12 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6"
      >
        {/* Logo + Social */}
        <div>
          <h3 className="text-3xl font-bold text-green-500 mb-4">TurfTime</h3>
          <p>Book your perfect turf experience with ease and excitement.</p>
          <div className="flex space-x-4 mt-4">
            {[Facebook, Twitter, Instagram].map((Icon, i) => (
              <motion.a
                key={i}
                href="#"
                whileHover={{ scale: 1.2 }}
                className="text-gray-400 hover:text-green-400 transition"
              >
                <Icon size={20} />
              </motion.a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-lg font-semibold text-green-400 mb-3">Quick Links</h4>
          <ul className="space-y-2">
            {["Home", "About", "Turfs", "Contact"].map((name, i) => (
              <li key={i}>
                <Link to={`/${name.toLowerCase()}`} className="hover:text-green-400 transition">
                  {name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h4 className="text-lg font-semibold text-green-400 mb-3">Services</h4>
          <ul className="space-y-2">
            {["Football", "Cricket", "Events", "Tournaments"].map((service, i) => (
              <li key={i}>
                <Link to="/turfs" className="hover:text-green-400 transition">
                  {service}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h4 className="text-lg font-semibold text-green-400 mb-3">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start">
              <MapPin size={18} className="text-green-500 mr-2 mt-0.5" />
              <span>123 Sports Ave, Stadium District</span>
            </li>
            <li className="flex items-center">
              <Phone size={18} className="text-green-500 mr-2" /> +1 (555) 123-4567
            </li>
            <li className="flex items-center">
              <Mail size={18} className="text-green-500 mr-2" /> info@turftime.com
            </li>
          </ul>
        </div>
      </motion.div>

      {/* Bottom Bar */}
      <div className="text-center text-gray-500 text-sm mt-10 border-t border-gray-800 pt-6">
        © {new Date().getFullYear()} TurfTime. All rights reserved.
      </div>

      {/* Soft Glow Animation */}
      <motion.div
        className="absolute bottom-0 right-0 w-72 h-72 bg-green-500/20 rounded-full blur-3xl"
        initial={{ scale: 0 }}
        animate={{ scale: [0.8, 1.1, 0.9] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
    </footer>
  );
}
