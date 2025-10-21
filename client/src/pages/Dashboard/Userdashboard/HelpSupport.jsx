import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  HelpCircle,
  Search,
  MessageCircle,
  Phone,
  Mail,
  ChevronDown,
  ChevronRight,
  Send,
  Book,
  CreditCard,
  Calendar,
  User,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext.jsx";
import Sidebar from "../../../components/Sidebar/UserSidebar";
// Local Card fallback (components/ui/Card not present)
function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl shadow-lg bg-white dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}
import toast from "react-hot-toast";
import axios from "axios";

const UserHelp = () => {
  const { user } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("faq");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "booking",
    priority: "medium",
    description: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const faqData = [
    {
      id: 1,
      category: "booking",
      question: "How do I book a turf?",
      answer:
        "To book a turf, browse available turfs, select your date and time slot, fill details, and proceed to payment.",
    },
    {
      id: 2,
      category: "booking",
      question: "Can I cancel my booking?",
      answer:
        "Yes, you can cancel from the 'My Bookings' section. Cancellation policy depends on turf and timing.",
    },
    {
      id: 3,
      category: "payment",
      question: "What payment methods are accepted?",
      answer:
        "We accept UPI, Cards, Net Banking, and Digital Wallets. Payments are processed securely.",
    },
    {
      id: 4,
      category: "payment",
      question: "How do refunds work?",
      answer:
        "Refunds follow the cancellation policy. They usually take 3–7 business days after approval.",
    },
    {
      id: 5,
      category: "account",
      question: "How do I reset my password?",
      answer:
        "Click 'Forgot Password' on login, enter your email, and follow the instructions sent.",
    },
    {
      id: 6,
      category: "account",
      question: "How can I update my profile information?",
      answer:
        "Go to Profile Settings in your dashboard to update your personal information.",
    },
    {
      id: 7,
      category: "general",
      question: "What are your operating hours?",
      answer:
        "Support operates Mon–Sun, 9:00 AM to 9:00 PM. Booking is available 24/7.",
    },
    {
      id: 8,
      category: "general",
      question: "How do I contact customer support?",
      answer:
        "Use this form, email support@turrfown.com, call us, or use live chat.",
    },
  ];

  const filteredFAQs = useMemo(
    () =>
      faqData.filter(
        (faq) =>
          faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [faqData, searchTerm]
  );

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleFormChange = (e) => {
    setTicketForm({ ...ticketForm, [e.target.name]: e.target.value });
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();

    if (!user?._id || !user?.email) {
      toast.error("User not authenticated");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:4500/api/support/ticket",
        { ...ticketForm, userId: user._id, userEmail: user.email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Support ticket submitted successfully!");
      setTicketForm({
        subject: "",
        category: "booking",
        priority: "medium",
        description: "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Error submitting ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      booking: <Calendar className="w-5 h-5" />,
      payment: <CreditCard className="w-5 h-5" />,
      account: <User className="w-5 h-5" />,
      general: <HelpCircle className="w-5 h-5" />,
    };
    return icons[category] || <HelpCircle className="w-5 h-5" />;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Please log in to access help & support</div>
      </div>
    );
  }

  return (
    <div
      className={`${
        darkMode ? "dark" : ""
      } min-h-screen bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800`}
    >
      <div className="flex">
        <Sidebar user={user} onToggleDark={() => setDarkMode(!darkMode)} darkMode={darkMode} />
        <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-8 pt-48 pb-8 min-h-screen">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Header + Tabs */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Help & Support</h1>
                <p className="text-gray-600 dark:text-gray-300">Find answers or create a support ticket.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab("faq")}
                  className={`px-3 py-2 rounded ${activeTab === "faq" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700"}`}>
                  FAQs
                </button>
                <button
                  onClick={() => setActiveTab("contact")}
                  className={`px-3 py-2 rounded ${activeTab === "contact" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700"}`}>
                  Contact / Ticket
                </button>
              </div>
            </div>

            {activeTab === "faq" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-4">
                  <div className="flex items-center mb-4">
                    <Search className="w-5 h-5 mr-2 text-gray-500" />
                    <input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search FAQs..."
                      className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {filteredFAQs.length ? (
                    <div className="space-y-3">
                      {filteredFAQs.map((faq) => (
                        <div key={faq.id} className="border rounded-md overflow-hidden">
                          <button
                            onClick={() => toggleFAQ(faq.id)}
                            className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-green-50 rounded-md">
                                {getCategoryIcon(faq.category)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{faq.question}</div>
                                <div className="text-xs text-gray-500">Category: {faq.category}</div>
                              </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`} />
                          </button>
                          {expandedFAQ === faq.id && (
                            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300">{faq.answer}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 p-6">No FAQs match your search.</div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Popular Topics</h3>
                  <div className="grid gap-3">
                    {['Booking', 'Payments', 'Account', 'General'].map((t) => (
                      <button key={t} onClick={() => setSearchTerm(t)} className="text-left px-3 py-2 rounded bg-gray-100 dark:bg-gray-700">{t}</button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {activeTab === "contact" && (
              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="text-xl font-semibold mb-4">Submit a Support Ticket</h3>
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Subject</label>
                      <input name="subject" value={ticketForm.subject} onChange={handleFormChange} className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <select name="category" value={ticketForm.category} onChange={handleFormChange} className="px-3 py-2 rounded border dark:bg-gray-700 dark:text-white">
                        <option value="booking">Booking</option>
                        <option value="payment">Payment</option>
                        <option value="account">Account</option>
                        <option value="general">General</option>
                      </select>
                      <select name="priority" value={ticketForm.priority} onChange={handleFormChange} className="px-3 py-2 rounded border dark:bg-gray-700 dark:text-white">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea name="description" value={ticketForm.description} onChange={handleFormChange} rows={6} className="w-full px-3 py-2 rounded border dark:bg-gray-700 dark:text-white" />
                    </div>

                    <div className="flex justify-end">
                      <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded">{submitting ? 'Submitting...' : 'Submit Ticket'}</button>
                    </div>
                  </form>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
                  <p className="text-gray-600 mb-4">Prefer to email or call? Reach out directly:</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3"><Mail className="w-5 h-5" /> <a className="text-green-600" href="mailto:support@turrfown.com">support@turrfown.com</a></div>
                    <div className="flex items-center gap-3"><Phone className="w-5 h-5" /> <a className="text-green-600" href="tel:+911234567890">+91 12345 67890</a></div>
                    <div className="text-sm text-gray-500">Support hours: 9:00 AM - 9:00 PM (Daily)</div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default UserHelp;
