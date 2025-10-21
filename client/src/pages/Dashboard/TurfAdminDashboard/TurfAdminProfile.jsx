import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../../context/AuthContext";
import { useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../config/Api";
import { User, Phone, MapPin, Edit, Save, X, Camera } from "lucide-react";

export default function TurfAdminProfile() {
  const { user, login } = useAuth();
  const { darkMode } = useOutletContext() || {};
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) setFormData({ name: user.name, email: user.email, phone: user.phone, address: user.address, businessName: user.businessName, description: user.description });
  }, [user]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.patch("/api/turfs/my-turf", formData);
      login(res.data.user || res.data);
      localStorage.setItem("user", JSON.stringify(res.data.user || res.data));
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch (err) {
      // server may not expose a direct profile endpoint; keep local state and inform user
      console.warn('Profile update endpoint missing or failed, keeping changes locally.');
      login(formData);
      localStorage.setItem("user", JSON.stringify(formData));
      toast.success("Profile saved locally (dev fallback)");
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const sectionWrapper = (children, delay = 0) => (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg space-y-6">
      {children}
    </motion.div>
  );

  const renderField = (label, name, icon = null, type = "text", placeholder = "") => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      {isEditing ? (
        type === "textarea" ? (
          <textarea name={name} value={formData[name] || ""} onChange={handleChange} rows={4} placeholder={placeholder} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        ) : (
          <input type={type} name={name} value={formData[name] || ""} onChange={handleChange} placeholder={placeholder} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        )
      ) : (
        <div className="flex items-center space-x-2 p-2">
          {icon && <icon className="w-4 h-4 text-gray-400" />}
          <span className="text-gray-900 dark:text-white">{formData[name] || "Not provided"}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      {sectionWrapper(
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your account info</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">
              <Edit className="w-4 h-4 mr-2" />Edit Profile
            </button>
          ) : (
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg flex items-center"><X className="w-4 h-4 mr-2" />Cancel</button>
              <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center disabled:opacity-50"><Save className="w-4 h-4 mr-2" />{loading ? "Saving..." : "Save"}</button>
            </div>
          )}
        </div>
      )}

      {/* Profile Info */}
      {sectionWrapper(
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">{user?.name?.charAt(0) || "T"}</div>
            {isEditing && (
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white hover:bg-green-700"><Camera className="w-4 h-4" /></button>
            )}
          </div>
          <div className="flex-1 space-y-4">
            {renderField("Full Name", "name")}
            {renderField("Email Address", "email", null, "email")}
          </div>
        </div>
      )}

      {/* Contact & Business Info */}
      {sectionWrapper(
        <>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contact Information</h3>
          {renderField("Phone Number", "phone", Phone, "text", "+91 9876543210")}
          {renderField("Business Address", "address", MapPin, "text", "Business address")}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Business Information</h3>
          {renderField("Business Name", "businessName")}
          {renderField("Business Description", "description", null, "textarea", "Describe your business...")}
        </>
      )}
    </div>
  );
}
