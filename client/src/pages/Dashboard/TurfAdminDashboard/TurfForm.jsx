import React, { useState, useEffect, useRef } from "react";
import { X, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import api from "../../../config/Api";
import { useAuth } from "../../../context/AuthContext";

const PLACEHOLDER_SVG = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'>
    <rect width='100%' height='100%' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='Arial, Helvetica, sans-serif' font-size='20'>No Image Selected</text>
  </svg>`
);

export default function TurfForm({ isOpen, onClose, onTurfAdded, editingTurf, darkMode }) {
  const { user, role } = useAuth();
  const isAdmin = role === "admin" || user?.role === "admin";
  const [form, setForm] = useState({
    name: "",
    location: "",
    pricePerHour: "",
    sportType: "football",
    description: "",
  // image: null,
  });
  // Remove image preview and upload progress
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTurf) {
      setForm({
        name: editingTurf.name || "",
        location: editingTurf.location || "",
        pricePerHour: editingTurf.pricePerHour || "",
        sportType: editingTurf.sportType || "football",
        description: editingTurf.description || "",
    // image: editingTurf.image || null,
      });
  // setPreview(editingTurf.image || null);
    } else {
      setForm({
        name: "",
        location: "",
        pricePerHour: "",
        sportType: "football",
        description: "",
    // image: null,
      });
  // setPreview(null);
    }
  }, [editingTurf, isOpen]);

  // Remove handleImage logic

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('Debug: token before submit ->', localStorage.getItem('token'));
    try {
      // prevent non-admins from submitting
      if (!isAdmin) {
        toast.error("Only admins can add or edit turfs");
        setLoading(false);
        return;
      }

      // Basic client-side validation
      if (!form.name || !form.location || !form.pricePerHour) {
        toast.error('Please fill required fields: name, location, price');
        setLoading(false);
        return;
      }

      // Remove FormData and upload config, use plain object
      const turfData = {
        name: form.name,
        location: form.location,
        pricePerHour: form.pricePerHour,
        sportType: form.sportType,
        description: form.description
      };

      let res;
      if (editingTurf) {
        res = await api.put(`/api/turfs/${editingTurf._id}`, turfData);
        console.debug('TurfForm: update response', res?.data);
      } else {
        res = await api.post(`/api/turfs`, turfData);
        console.debug('TurfForm: create response', res?.data);
      }

      // Debug: log imageUrl and turf object
      // Remove imageUrl and preview logic

      toast.success(editingTurf ? "Turf updated" : "Turf created");
      onTurfAdded && onTurfAdded();
      onClose && onClose();
    } catch (err) {
      console.error("Save turf error:", err);
      const msg = err.response?.data?.message || err.message || "Could not save turf";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Remove preview cleanup effect

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

          <motion.form
            onSubmit={submit}
            initial={{ scale: 0.9, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className={`relative z-10 w-full max-w-lg p-6 rounded-2xl shadow-xl ${
              darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingTurf ? "Edit Turf" : "Add New Turf"}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3">
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Turf Name"
                className={`w-full px-4 py-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-300"
                }`}
              />

              <input
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="Location"
                className={`w-full px-4 py-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-300"
                }`}
              />

              <input
                type="number"
                required
                value={form.pricePerHour}
                onChange={(e) =>
                  setForm({ ...form, pricePerHour: e.target.value })
                }
                placeholder="Price Per Hour (₹)"
                className={`w-full px-4 py-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-300"
                }`}
              />

              <select
                value={form.sportType}
                onChange={(e) =>
                  setForm({ ...form, sportType: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-lg ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-300"
                }`}
              >
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
                <option value="basketball">Basketball</option>
                <option value="volleyball">Volleyball</option>
                <option value="badminton">Badminton</option>
                <option value="tennis">Tennis</option>
              </select>

              <textarea
                rows="3"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Description"
                className={`w-full px-4 py-2 border rounded-lg resize-none ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-gray-50 border-gray-300"
                }`}
              ></textarea>

              {/* Removed image upload UI */}
            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className={`px-4 py-2 rounded-lg border ${
                  darkMode
                    ? "border-gray-600 hover:bg-gray-800"
                    : "border-gray-300 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 shadow-md"
              >
                {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
