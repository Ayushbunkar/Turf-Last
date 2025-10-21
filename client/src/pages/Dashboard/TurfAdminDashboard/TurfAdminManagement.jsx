import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, CheckCircle, Clock, Building, Search, Filter,
  Plus, Eye, UserCheck, UserX, X, ChevronLeft, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_STYLES = {
  approved: { color: "green", label: "Approved", icon: <CheckCircle className="w-4 h-4 text-green-500" /> },
  pending: { color: "yellow", label: "Pending", icon: <Clock className="w-4 h-4 text-yellow-500" /> },
  suspended: { color: "purple", label: "Suspended", icon: <Clock className="w-4 h-4 text-purple-500" /> },
  rejected: { color: "red", label: "Rejected", icon: <X className="w-4 h-4 text-red-500" /> },
};

import { useOutletContext } from "react-router-dom";

const TurfAdminManagement = () => {
  const { darkMode } = useOutletContext() || {};
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  const perPage = 10;

  useEffect(() => {
    // Fetch real turf admins from the super admin service
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // try both fetch methods available in service
        const data = await (superAdminService?.fetchTurfAdmins ? superAdminService.fetchTurfAdmins() : superAdminService.getTurfAdmins());
        // service may return array or { turfAdmins: [], pagination }
        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data?.turfAdmins) list = data.turfAdmins;
        else if (data?.length) list = data;

        // normalize items to have metrics object and safe fields
        const normalized = list.map(item => ({
          _id: item._id || item.id || item._id,
          name: item.name || item.fullName || item.email || 'Unknown',
          email: item.email || '',
          phone: item.phone || '',
          status: item.status || 'pending',
          location: item.location || item.address || '',
          metrics: {
            turfsManaged: Number(item.turfsCount ?? item.metrics?.turfsManaged ?? 0) || 0,
            totalRevenue: Number(item.totalRevenue ?? item.metrics?.totalRevenue ?? 0) || 0,
            avgRating: Number(item.avgRating ?? item.metrics?.avgRating ?? 0) || 0
          }
        }));

        if (mounted) setAdmins(normalized);
      } catch (err) {
        console.error('Failed to fetch turf admins', err);
        if (mounted) setAdmins([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleStatus = (id, newStatus) => {
    toast.success(`Admin ${newStatus}`);
    setAdmins(a => a.map(x => (x._id === id ? { ...x, status: newStatus } : x)));
  };

  const filtered = useMemo(() =>
    admins.filter(a =>
      (a.name + a.email).toLowerCase().includes(search.toLowerCase()) &&
      (!status || a.status === status)
    ), [admins, search, status]
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const data = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = [
    { label: "Total Admins", value: admins.length, icon: Shield, color: "blue" },
    { label: "Active Admins", value: admins.filter(a => a.status === "approved").length, icon: CheckCircle, color: "green" },
    { label: "Pending", value: admins.filter(a => a.status === "pending").length, icon: Clock, color: "yellow" },
    { label: "Total Turfs", value: admins.reduce((s, a) => s + (a.metrics?.turfsManaged || 0), 0), icon: Building, color: "purple" },
  ];

  return (
    <div className={`flex min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-gray-100' : 'bg-gray-50'}`}>
      <div className="flex-1 p-8 pt-48">
        {/* Header */}
        <div className="flex justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Turf Admin Management</h1>
            <p className="text-gray-600">Manage all turf administrators</p>
          </div>
          <button onClick={() => setModal({ type: "create" })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Admin
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((s, i) => {
            const colorTokens = {
              blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
              green: { bg: 'bg-green-100', icon: 'text-green-600' },
              yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
              purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
              default: { bg: 'bg-gray-100', icon: 'text-gray-600' }
            };
            const token = colorTokens[s.color] || colorTokens.default;
            return (
              <div key={i} className={`p-6 rounded-xl shadow-sm border flex items-center gap-3 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border'} `}>
                <div className={`p-3 ${token.bg} rounded-lg`}>
                  <s.icon className={`w-6 h-6 ${token.icon}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-gray-600 text-sm">{s.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className={`p-6 rounded-xl shadow-sm mb-6 flex items-center gap-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border'} `}>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search admins..."
              className={`w-full pl-10 py-2 border rounded-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : ''}`} />
          </div>
          <FilterDropdown value={status} onChange={setStatus} />
        </div>

        {/* Table */}
        <div className={`rounded-xl shadow-sm border overflow-x-auto ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border'}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                {["Admin", "Status", "Performance", "Actions"].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-sm font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows />
              ) : data.length ? (
                data.map(a => <AdminRow key={a._id} admin={a} onView={setModal} onStatus={handleStatus} />)
              ) : (
                <tr><td colSpan="4" className={`py-12 text-center ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>No admins found</td></tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <span className="text-sm text-gray-700">Page {page} of {totalPages}</span>
              <div className="flex items-center gap-2">
                <PageBtn icon={ChevronLeft} disabled={page === 1} onClick={() => setPage(p => p - 1)} />
                <span className="px-3 py-1 bg-blue-600 text-white rounded-lg">{page}</span>
                <PageBtn icon={ChevronRight} disabled={page === totalPages} onClick={() => setPage(p => p + 1)} />
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal data={modal} onClose={() => setModal(null)} onStatus={handleStatus} />
    </div>
  );
};

// ✅ Reusable Components
const AdminRow = ({ admin, onView, onStatus }) => {
  const s = STATUS_STYLES[admin.status] || STATUS_STYLES.pending;
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
          {admin.name[0]}
        </div>
        <div>
          <p className="font-medium text-sm">{admin.name}</p>
          <p className="text-gray-500 text-sm">{admin.email}</p>
        </div>
      </td>
      <td className="px-6 py-4 flex items-center gap-2">
        {s.icon}
        {/* map status color to safe tailwind classes */}
        {(() => {
          const statusMap = {
            green: { bg: 'bg-green-100', text: 'text-green-700' },
            yellow: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-700' },
            red: { bg: 'bg-red-100', text: 'text-red-700' },
            default: { bg: 'bg-gray-100', text: 'text-gray-700' }
          };
          const token = statusMap[s.color] || statusMap.default;
          return <span className={`px-2 py-1 text-xs font-medium rounded-full ${token.text} ${token.bg}`}>{s.label}</span>;
        })()}
      </td>
      <td className="px-6 py-4 text-sm text-gray-600">
        {admin.metrics.turfsManaged} turfs • ₹{admin.metrics.totalRevenue.toLocaleString()} • {admin.metrics.avgRating}/5
      </td>
      <td className="px-6 py-4 flex justify-end gap-2">
        <button onClick={() => onView({ type: "details", admin })} className="p-1 text-gray-400 hover:text-blue-600"><Eye className="w-4 h-4" /></button>
        {admin.status === "pending" && <button onClick={() => onView({ type: "approve", admin })} className="p-1 text-gray-400 hover:text-green-600"><UserCheck className="w-4 h-4" /></button>}
        {admin.status === "approved" && <button onClick={() => onStatus(admin._id, "suspended")} className="p-1 text-gray-400 hover:text-purple-600"><UserX className="w-4 h-4" /></button>}
        {admin.status === "suspended" && <button onClick={() => onStatus(admin._id, "approved")} className="p-1 text-gray-400 hover:text-green-600"><UserCheck className="w-4 h-4" /></button>}
      </td>
    </tr>
  );
};

const FilterDropdown = ({ value, onChange }) => (
  <select value={value} onChange={e => onChange(e.target.value)} className="px-3 py-2 border rounded-lg">
    <option value="">All Statuses</option>
    <option value="approved">Approved</option>
    <option value="pending">Pending</option>
    <option value="suspended">Suspended</option>
  </select>
);

const SkeletonRows = () =>
  [...Array(5)].map((_, i) => (
    <tr key={i} className="border-b">
      {[...Array(4)].map((_, j) => (
        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>
      ))}
    </tr>
  ));

const PageBtn = ({ icon: Icon, ...props }) => (
  <button {...props} className="p-2 border rounded-lg disabled:opacity-40">
    <Icon className="w-4 h-4" />
  </button>
);

const Modal = ({ data, onClose, onStatus }) => (
  <AnimatePresence>
    {data && (
      <motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
          className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg">
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">
              {data.type === "create" ? "Add Admin" : data.type === "approve" ? "Approve Admin" : "Admin Details"}
            </h2>
            <button onClick={onClose}><X className="w-6 h-6" /></button>
          </div>

          {data.type === "details" && (
            <div className="space-y-2 text-sm text-gray-700">
              {Object.entries(data.admin || {}).map(([k, v]) => (
                <p key={k}><strong>{k}:</strong> {JSON.stringify(v)}</p>
              ))}
            </div>
          )}

          {data.type === "create" && (
            <form className="space-y-4">
              {["Name", "Email", "Password"].map(f => (
                <input key={f} placeholder={f} type={f === "Email" ? "email" : "text"} className="w-full px-3 py-2 border rounded-lg" />
              ))}
              <div className="flex justify-end gap-3">
                <button onClick={onClose} type="button" className="px-4 py-2 border rounded-lg">Cancel</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          )}

          {data.type === "approve" && (
            <div className="space-y-3">
              <textarea rows={3} placeholder="Reason (optional)" className="w-full border rounded-lg p-2" />
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={() => onStatus(data.admin._id, "approved")} className="px-4 py-2 bg-green-600 text-white rounded-lg">Approve</button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default TurfAdminManagement;
