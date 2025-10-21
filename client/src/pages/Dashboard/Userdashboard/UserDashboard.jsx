import React, { useEffect, useState } from "react";
import Sidebar from "../../../components/Sidebar/UserSidebar";

// Local Card component
function Card({ className = "", children }) {
  return (
    <div className={`rounded-xl shadow-lg bg-white dark:bg-gray-800 ${className}`}>
      {children}
    </div>
  );
}
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import toast from "react-hot-toast";
import api from "../../../config/Api.jsx";

function EditProfileModal({ open, onClose, user, token, onProfileUpdate }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setError("");
  }, [user, open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.patch("/api/user/me", { name, email });
      const updated = data.user;
      // if email changed, force re-login for security
      if (updated.email && user?.email && updated.email !== user.email) {
        // clear token and user, then navigate to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        onClose();
        toast.success('Email updated — please sign in again');
        window.location.href = '/login';
        return;
      }
      onProfileUpdate(updated);
      onClose();
      toast.success("Profile updated!");
    } catch (err) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 pt-20 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>
        {["Name", "Email"].map((field, idx) => (
          <div className="mb-3" key={idx}>
            <label className="block text-sm mb-1">{field}</label>
            <input
              className="w-full border px-3 py-2 rounded"
              value={field === "Name" ? name : email}
              onChange={(e) => (field === "Name" ? setName(e.target.value) : setEmail(e.target.value))}
              disabled={loading}
            />
          </div>
        ))}
        {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
        <div className="flex justify-end space-x-2 mt-4">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const { user, login, updateUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ bookings: 0, upcoming: 0, completed: 0, spent: 0 });

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    api.get("/api/bookings/my-bookings", { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data }) => {
        setStats({
          bookings: data.length,
          upcoming: data.filter((b) => b.status === "upcoming").length,
          completed: data.filter((b) => b.status === "completed").length,
          spent: data.reduce((sum, b) => sum + (b.price || 0), 0),
        });
      })
      .catch(() => toast.error("Failed to load dashboard data"));
  }, [token]);

  const handleProfileUpdate = (updatedUser) => {
    // update only the user object in context (do not touch token)
    updateUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  if (!user) return <div className="flex items-center justify-center h-screen">Please log in to view your dashboard</div>;

  return (
    <>
      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} user={user} token={token} onProfileUpdate={handleProfileUpdate} />
      <div className={`${darkMode ? "dark" : ""} min-h-screen  bg-gradient-to-br from-green-50 via-green-100 to-green-200 dark:from-gray-900 dark:to-gray-800`}>
  {isMobileSidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setIsMobileSidebarOpen(false)} />}
        <div className="flex">
          <Sidebar user={user} onToggleDark={() => setDarkMode(!darkMode)} darkMode={darkMode} isMobileOpen={isMobileSidebarOpen} onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />
          <main className="flex-1 ml-0 lg:ml-64 p-4 lg:p-8 pt-48 space-y-8 pb-8 min-h-screen">
            
            {/* Profile Card */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-md mx-auto mb-8">
              <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
                <div className="w-16 h-16 rounded-full bg-green-500 text-white mx-auto flex items-center justify-center text-2xl mb-4 font-semibold">{user.name?.[0]?.toUpperCase() || "U"}</div>
                <h3 className="text-xl font-semibold">{user.name}</h3>
                <p className="text-gray-500">{user.email}</p>
                <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setEditOpen(true)}>Edit Profile</button>
              </Card>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
                { label: "Total Bookings", value: stats.bookings, color: "text-green-600" },
                { label: "Upcoming Games", value: stats.upcoming, color: "text-blue-600" },
                { label: "Total Spent", value: `₹${stats.spent}`, color: "text-purple-600" },
              ].map((card, idx) => (
                <Card key={idx} className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
                  <div className={`text-3xl font-bold ${card.color} mb-2`}>{card.value}</div>
                  <div className="text-gray-600 dark:text-gray-300 font-medium">{card.label}</div>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/turfs" className="flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg">Book New Turf</Link>
                <Link to="/dashboard/user/my-bookings" className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">View My Bookings</Link>
                <Link to="/dashboard/user/profile" className="flex items-center justify-center px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg">Manage Profile</Link>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </>
  );
}

