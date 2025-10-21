import React, { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Mail, MessageSquare, Phone, ChevronDown, ChevronUp } from "lucide-react";

export default function TurfAdminHelp() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    {
      category: "Account",
      questions: [
        { q: "How do I reset my password?", a: "Go to account settings → 'Change Password' → follow steps. You'll get a confirmation email." },
        { q: "How do I update my contact information?", a: "In profile settings, update your email, phone number, and other details." },
      ],
    },
    {
      category: "Booking",
      questions: [
        { q: "How can I view my turf bookings?", a: "Go to Bookings section in dashboard to view all past and upcoming bookings." },
        { q: "Can I cancel a booking?", a: "Yes, up to 24 hours before scheduled time." },
      ],
    },
    {
      category: "Payment",
      questions: [
        { q: "How do I receive payments?", a: "Payments are transferred weekly to your registered bank account." },
        { q: "What payment methods are supported?", a: "UPI apps, credit/debit cards, and net banking are supported." },
      ],
    },
  ];

  const supportContacts = [
    { icon: Mail, title: "Email Support", info: "support@turfdash.com", note: "Response within 24 hours" },
    { icon: Phone, title: "Phone Support", info: "+91 98765 43210", note: "Mon-Fri, 9AM-6PM" },
    { icon: MessageSquare, title: "Live Chat", info: "Instant help from our team", note: "Available 24/7" },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-3">Help & Support Center</h1>
        <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">Get help with turf management, find answers to FAQs, and connect with support.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FAQs */}
        <div className="lg:col-span-2 space-y-6">
          {faqs.map((cat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{cat.category}</h3>
              {cat.questions.map((faq, j) => (
                <div key={j} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <button
                    onClick={() => setOpenFAQ(openFAQ === `${i}-${j}` ? null : `${i}-${j}`)}
                    className="flex justify-between w-full text-left font-medium text-gray-900 dark:text-white"
                  >
                    {faq.q}
                    {openFAQ === `${i}-${j}` ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </button>
                  {openFAQ === `${i}-${j}` && (
                    <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-2 text-gray-700 dark:text-gray-300">
                      {faq.a}
                    </motion.p>
                  )}
                </div>
              ))}
            </motion.div>
          ))}
        </div>

        {/* Support Section */}
        <div className="space-y-6">
          {/* Contact Cards */}
          {supportContacts.map((contact, idx) => (
            <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contact Support</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <contact.icon className="h-5 w-5 text-green-600" />
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{contact.title}</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{contact.info}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{contact.note}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Ticket Form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create Support Ticket</h3>
            <form className="space-y-4">
              {["Subject", "Description"].map((label, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium mb-2 text-gray-800 dark:text-gray-300">{label}</label>
                  {label === "Description" ? (
                    <textarea rows={3} placeholder={`Describe your issue`} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500"></textarea>
                  ) : (
                    <input type="text" placeholder={`Enter ${label.toLowerCase()}`} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500" />
                  )}
                </div>
              ))}
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg">Submit Ticket</button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
