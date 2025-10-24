
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Building,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Calendar,
  Camera,
  Users,
  Mail,
  Star,
  Eye,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  MapPin,
  MoreVertical,
} from "lucide-react";

import SuperAdminPageTemplate from './SuperAdminPageTemplate';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';
import TurfForm from '../TurfAdminDashboard/TurfForm';

const PLACEHOLDER = "data:image/svg+xml;utf8," + encodeURIComponent(`
  <svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'>
    <rect width='100%' height='100%' fill='#f3f4f6'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#9ca3af' font-family='Arial, Helvetica, sans-serif' font-size='18'>No Image</text>
  </svg>
`);

const getStatusBadge = (status) => {
  const safeStatus = (typeof status === 'string' && status.length > 0) ? status : 'pending';
  const config = {
    active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    blocked: { color: 'bg-red-100 text-red-800', icon: XCircle },
    maintenance: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
  }[safeStatus] || { color: 'bg-gray-100 text-gray-600', icon: Clock };

  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="w-3 h-3 mr-1" /> {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </span>
  );
};

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

const TurfDetailsModal = ({ turf, isOpen, onClose }) => {
  if (!turf) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col lg:flex-row gap-6 p-4">
        <div className="lg:w-1/2 h-64 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
          {turf.images?.[0] ? (
            <img src={turf.images[0]} alt={turf.name} className="w-full h-full object-cover" />
          ) : <Camera className="w-12 h-12 text-gray-400" />}
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">{turf.name}</h2>
            <p className="text-gray-600 mb-4">{turf.description || 'No description'}</p>
            <div className="flex gap-4 mb-2">
              <div className="flex items-center text-gray-700"><Calendar className="w-4 h-4 mr-1" />Bookings: {turf.totalBookings || 0}</div>
              <div className="flex items-center text-gray-700"><IndianRupee className="w-4 h-4 mr-1" />Revenue: ₹{turf.revenue || 0}</div>
            </div>
            <div className="mt-2">{getStatusBadge(turf.status)}</div>
            {turf.blockReason ? (
              <div className="mt-3 p-3 bg-red-50 rounded">
                <h4 className="text-sm font-medium text-red-700">Block reason</h4>
                <p className="text-sm text-red-600">{turf.blockReason}</p>
                {turf.lastBlockedAt ? <div className="text-xs text-gray-500 mt-1">Blocked at: {new Date(turf.lastBlockedAt).toLocaleString()}</div> : null}
              </div>
            ) : null}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Owner</h3>
              <div className="text-gray-700 text-sm space-y-1">
                <div className="flex items-center"><Users className="w-4 h-4 mr-2" />{turf.owner?.name || (turf.admin && turf.admin.name) || 'N/A'}</div>
                <div className="flex items-center"><Mail className="w-4 h-4 mr-2" />{turf.owner?.email || (turf.admin && turf.admin.email) || 'N/A'}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

const DeleteModal = ({ turf, isOpen, onClose, onConfirm }) => {
  if (!turf) return null;
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900">Delete Turf</h3>
        </div>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete "{turf.name}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={() => onConfirm(turf.id || turf._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
        </div>
      </div>
    </Modal>
  );
};

const SuperAdminTurfsandVenues = () => {
  const [turfs, setTurfs] = useState([]);
  const [turfStats, setTurfStats] = useState({ totalTurfs: null, activeTurfs: null, pendingTurfs: null, blockedTurfs: null });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [categories, setCategories] = useState(['Cricket', 'Football', 'Tennis', 'Badminton']);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [editingTurf, setEditingTurf] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddTurfModal, setShowAddTurfModal] = useState(false);
  const [showEditTurfModal, setShowEditTurfModal] = useState(false);
  const [statusChanging, setStatusChanging] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [showBlockReasonModal, setShowBlockReasonModal] = useState(false);
  const [blockReasonForBatch, setBlockReasonForBatch] = useState('');
  const [showSingleBlockModal, setShowSingleBlockModal] = useState(false);
  const [singleBlockTurfId, setSingleBlockTurfId] = useState(null);
  const [singleBlockReason, setSingleBlockReason] = useState('');
  const [menuOpen, setMenuOpen] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const toggleMenu = (id) => setMenuOpen(m => ({ ...m, [id]: !m[id] }));
  const closeMenu = (id) => setMenuOpen(m => ({ ...m, [id]: false }));

  // close any open menu when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (Object.values(menuOpen).some(Boolean)) {
        setMenuOpen({});
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  // fetch lists and stats (extracted so callers can refresh after create/update)
  const fetchTurfs = async (page = currentPage) => {
    setLoading(true);
    try {
      // ensure current page is set to requested page
      if (page !== currentPage) setCurrentPage(page);
      const res = await superAdminService.getAllTurfs({
        page,
        limit: 12,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        sortBy,
      });
      setTurfs(res.turfs || []);
      setTotalPages(res.pagination?.totalPages || 1);
    } catch (e) {
      console.error('fetchTurfs error', e);
      setTurfs([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchBlockConfirm = async (reason) => {
    if (!selectedIds.length) return;
    try {
      setBatchLoading(true);
      setTurfs(list => list.map(t => selectedIds.includes(t._id || t.id) ? { ...t, status: 'blocked' } : t));
      await superAdminService.batchSetTurfStatus(selectedIds, 'blocked', reason || '');
      setSelectedIds([]);
      fetchTurfStats();
      toast.success('Selected turfs blocked');
      fetchTurfs();
    } catch (err) {
      console.error('batch block err', err);
      toast.error('Batch block failed');
      fetchTurfs();
    } finally {
      setBatchLoading(false);
      setShowBlockReasonModal(false);
      setBlockReasonForBatch('');
    }
  };

  const handleSingleBlockConfirm = async () => {
    const turfId = singleBlockTurfId;
    if (!turfId) return;
    try {
      setStatusChanging(s => ({ ...s, [turfId]: 'blocked' }));
      await handleSetTurfStatus(turfId, 'blocked', singleBlockReason || '');
      toast.success('Turf blocked');
      fetchTurfs();
    } catch (err) {
      console.error('single block err', err);
      toast.error('Failed to block turf');
      fetchTurfs();
    } finally {
      setShowSingleBlockModal(false);
      setSingleBlockTurfId(null);
      setSingleBlockReason('');
    }
  };

  const fetchTurfStats = async () => {
    try {
      const stats = await superAdminService.getTurfStats();
      // Normalize to numbers or null
      const toNum = v => (v === undefined || v === null ? null : Number(v));
      setTurfStats({
        totalTurfs: toNum(stats?.totalTurfs ?? stats?.total),
        activeTurfs: toNum(stats?.activeTurfs ?? stats?.active),
        pendingTurfs: toNum(stats?.pendingTurfs ?? stats?.pending),
        blockedTurfs: toNum(stats?.blockedTurfs ?? stats?.blocked),
      });
    } catch (err) {
      // keep nulls as fallback
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      // fetch fresh data for page 1 and refresh stats
      await Promise.all([fetchTurfs(1), fetchTurfStats()]);
      toast.success('Refreshed');
    } catch (err) {
      console.error('refresh error', err);
      toast.error('Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTurfs();
    fetchTurfStats();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, sortBy]);

  const handleDelete = async (turfId) => {
    console.log('Attempting delete for turfId:', turfId);
    try {
      await superAdminService.deleteTurf(turfId);
      toast.success("Turf deleted");
      setShowDeleteModal(false);
      setSelectedTurf(null);
      setCurrentPage(1);
    } catch (err) {
      console.error('deleteTurf error:', err);
      const msg = err?.message || 'Failed to delete';
      // If server says resource not found, remove it from client list to avoid repeated 404s
      if (err?.status === 404) {
        toast.error('Turf not found on server — removing from list');
        setTurfs(prev => prev.filter(t => (t._id || t.id) !== turfId));
        setShowDeleteModal(false);
        setSelectedTurf(null);
        return;
      }
      toast.error(msg);
    }
  };

  const handleSetTurfStatus = async (turfId, status, reason = '') => {
    const prev = turfs;
    try {
      setStatusChanging(s => ({ ...s, [turfId]: status }));
      // optimistic update
      setTurfs(list => list.map(t => (t._id === turfId || t.id === turfId) ? { ...t, status } : t));
      await superAdminService.setTurfStatus(turfId, status, { reason });
      fetchTurfStats();
    } catch (err) {
      console.error('setTurfStatus error', err);
      setTurfs(prev);
      toast.error('Failed to update status');
    } finally {
      setStatusChanging(s => { const c = { ...s }; delete c[turfId]; return c; });
    }
  };

  const calcClient = {
    total: turfs.length,
    active: turfs.filter(t => t.status === 'active').length,
    pending: turfs.filter(t => t.status === 'pending').length,
    blocked: turfs.filter(t => t.status === 'blocked').length,
  };

  const statCards = [
    { title: 'Total Turfs', value: turfStats.totalTurfs ?? calcClient.total, icon: Building, color: 'blue', description: 'Total number of turfs.' },
    { title: 'Active Turfs', value: turfStats.activeTurfs ?? calcClient.active, icon: CheckCircle, color: 'green', description: 'Currently active turfs.' },
    { title: 'Pending Turfs', value: turfStats.pendingTurfs ?? calcClient.pending, icon: Clock, color: 'yellow', description: 'Turfs pending approval.' },
    { title: 'Blocked Turfs', value: turfStats.blockedTurfs ?? calcClient.blocked, icon: XCircle, color: 'purple', description: 'Blocked or inactive turfs.' },
  ];

  return (
    <SuperAdminPageTemplate title="Turfs & Venues" subtitle="Manage all turfs, venues and operations">
      {/* Main white container */}
      <div className="bg-white rounded-2xl lg:mt-0 mt-16  p-6 shadow-lg w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Turfs & Venues Management</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all turfs, venues and their operations</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleRefresh} className={`flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 ${refreshing ? 'opacity-75' : ''}`}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /><span className="ml-1 hidden sm:inline">Refresh</span>
            </button>
            <button onClick={() => setShowAddTurfModal(true)} className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /><span className="ml-1">Add Turf</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const mapping = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', yellow: 'bg-yellow-100 text-yellow-600', purple: 'bg-purple-100 text-purple-600' };
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center mb-3">
                  <div className={`${mapping[card.color] || 'bg-gray-100 text-gray-600'} p-2 rounded-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900">{card.value}</h3>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-gray-500 text-xs mt-1">{card.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search turfs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-2xl w-full shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-2xl shadow-sm min-w-[140px]">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="blocked">Blocked</option>
            <option value="maintenance">Maintenance</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 border rounded-2xl shadow-sm min-w-[140px]">
            <option value="all">All Sports</option>
            {categories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-2xl shadow-sm min-w-[140px]">
            <option value="createdAt">Newest First</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Highest Rated</option>
            <option value="revenue">Top Revenue</option>
          </select>
        </div>

        {/* Batch actions toolbar */}
        <div className="mb-4 flex items-center gap-3">
          <input type="checkbox" className="w-4 h-4" checked={selectedIds.length === turfs.length && turfs.length > 0} onChange={(e) => {
            if (e.target.checked) setSelectedIds(turfs.map(t => t._id || t.id)); else setSelectedIds([]);
          }} />
          <div className="text-sm text-gray-700">Select all ({turfs.length})</div>
          <div className="ml-auto text-sm text-gray-600">Use the action buttons on each turf card to change status</div>
        </div>

        {/* Turfs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf, index) => {
            const turfId = turf._id || turf.id || index;
            const isSelected = selectedIds.includes(turfId);
            return (
            <motion.div
              key={turfId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-xl shadow-sm border border-gray-100"
            >
              {/* Turf Image */}
              <div className="relative h-36 overflow-hidden">
                <img
                  src={(Array.isArray(turf.images) && turf.images[0]) ? turf.images[0] : PLACEHOLDER}
                  alt={turf.name}
                  onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">{getStatusBadge(turf.status)}</div>
                <div className="absolute top-4 right-4">
                  <div className="flex items-center space-x-1 bg-white bg-opacity-90 rounded-full px-2 py-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-medium">{turf.rating}</span>
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="mb-2">
                  <input type="checkbox" checked={isSelected} onChange={(e) => {
                    setSelectedIds(prev => e.target.checked ? [...new Set([...prev, turfId])] : prev.filter(id => id !== turfId));
                  }} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{turf.name}</h3>
                  {turf.blockReason ? (
                    <div className="mb-3 p-2 bg-red-50 rounded text-sm text-red-700">
                      <div className="font-medium text-red-700 text-sm">Blocked</div>
                      <div className="text-xs text-red-600 whitespace-pre-wrap mt-1">{turf.blockReason}</div>
                      {turf.lastBlockedAt ? <div className="text-xs text-gray-500 mt-1">Blocked at: {new Date(turf.lastBlockedAt).toLocaleString()}</div> : null}
                    </div>
                  ) : null}
                <div className="flex items-center text-gray-600 mb-2 text-sm"><MapPin className="w-4 h-4 mr-2" />{turf.location}</div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-500">{turf.category}</span>
                  <span className="text-sm font-bold text-blue-600 flex items-center"><span className="mr-1">₹</span>{turf.pricePerHour}/hr</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">{turf.totalBookings || 0}</div>
                    <div className="text-xs text-gray-500">Bookings</div>
                  </div>
                  <div className="text-center p-2 bg-white rounded-lg border border-gray-200">
                    <IndianRupee className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">{turf.revenue || 0}</div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <button onClick={() => { setSelectedTurf(turf); setShowDetailsModal(true); }} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingTurf(turf); setShowEditTurfModal(true); }} className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => { setSelectedTurf(turf); setShowDeleteModal(true); }} className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Inline buttons for sm+ screens */}
                      <div className="hidden sm:flex items-center gap-2">
                        <button
                          disabled={!!statusChanging[turfId]}
                          onClick={async () => { setStatusChanging(s => ({ ...s, [turfId]: 'active' })); try { await handleSetTurfStatus(turfId, 'active'); } finally { setStatusChanging(s => { const c = { ...s }; delete c[turfId]; return c; }); } }}
                          className="min-w-[72px] px-2 py-1 rounded-full bg-green-600 text-white text-sm flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-60"
                        >
                          {statusChanging[turfId] === 'active' ? (<svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle></svg>) : null}
                          Approve
                        </button>

                        <button
                          disabled={!!statusChanging[turfId]}
                          onClick={() => { setSingleBlockTurfId(turfId); setSingleBlockReason(''); setShowSingleBlockModal(true); }}
                          className="min-w-[64px] px-2 py-1 rounded-full bg-red-600 text-white text-sm flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-60"
                        >
                          {statusChanging[turfId] === 'blocked' ? (<svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle></svg>) : null}
                          Block
                        </button>

                        <button
                          disabled={!!statusChanging[turfId]}
                          onClick={async () => { setStatusChanging(s => ({ ...s, [turfId]: 'pending' })); try { await handleSetTurfStatus(turfId, 'pending'); } finally { setStatusChanging(s => { const c = { ...s }; delete c[turfId]; return c; }); } }}
                          className="min-w-[72px] px-2 py-1 rounded-full bg-yellow-500 text-white text-sm flex items-center justify-center gap-2 hover:bg-yellow-600 disabled:opacity-60"
                        >
                          {statusChanging[turfId] === 'pending' ? (<svg className="animate-spin w-4 h-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle></svg>) : null}
                          Pending
                        </button>
                      </div>

                      {/* Kebab dropdown for xs screens */}
                      <div className="sm:hidden relative">
                        <button onClick={(e) => { e.stopPropagation(); toggleMenu(turfId); }} className="p-1 rounded-full bg-gray-100 hover:bg-gray-200">
                          <MoreVertical className="w-5 h-5 text-gray-700" />
                        </button>
                        {menuOpen[turfId] ? (
                          <div onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-md z-50 transform transition-all duration-150 ease-out">
                            <button onClick={async () => { closeMenu(turfId); setStatusChanging(s => ({ ...s, [turfId]: 'active' })); try { await handleSetTurfStatus(turfId, 'active'); toast.success('Approved'); } finally { setStatusChanging(s => { const c = { ...s }; delete c[turfId]; return c; }); } }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Approve</button>
                            <button onClick={() => { closeMenu(turfId); setSingleBlockTurfId(turfId); setSingleBlockReason(''); setShowSingleBlockModal(true); toast('Opening block reason'); }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Block</button>
                            <button onClick={async () => { closeMenu(turfId); setStatusChanging(s => ({ ...s, [turfId]: 'pending' })); try { await handleSetTurfStatus(turfId, 'pending'); toast.success('Set to pending'); } finally { setStatusChanging(s => { const c = { ...s }; delete c[turfId]; return c; }); } }} className="w-full text-left px-3 py-2 hover:bg-gray-50">Pending</button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
              );
          })}
        </div>

      </div>

      {/* Modals */}
      <TurfDetailsModal turf={selectedTurf} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      <DeleteModal turf={selectedTurf} isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} />

      {/* Block Reason Modal for batch blocking */}
      <Modal isOpen={showBlockReasonModal} onClose={() => setShowBlockReasonModal(false)}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Block Selected Turfs</h3>
          <p className="text-sm text-gray-600 mb-3">Provide an optional reason that will be recorded for these turfs.</p>
          <textarea value={blockReasonForBatch} onChange={(e) => setBlockReasonForBatch(e.target.value)} rows={4} className="w-full p-2 border rounded-lg" placeholder="Reason (optional)"></textarea>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowBlockReasonModal(false); setBlockReasonForBatch(''); }} className="px-3 py-2 border rounded-lg">Cancel</button>
            <button onClick={() => handleBatchBlockConfirm(blockReasonForBatch)} disabled={batchLoading} className="px-3 py-2 bg-red-600 text-white rounded-lg">Block</button>
          </div>
        </div>
      </Modal>

      {/* Single Turf Block Modal */}
      <Modal isOpen={showSingleBlockModal} onClose={() => { setShowSingleBlockModal(false); setSingleBlockTurfId(null); setSingleBlockReason(''); }}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-2">Block Turf</h3>
          <p className="text-sm text-gray-600 mb-3">Provide an optional reason that will be recorded for this turf.</p>
          <textarea value={singleBlockReason} onChange={(e) => setSingleBlockReason(e.target.value)} rows={4} className="w-full p-2 border rounded-lg" placeholder="Reason (optional)"></textarea>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowSingleBlockModal(false); setSingleBlockTurfId(null); setSingleBlockReason(''); }} className="px-3 py-2 border rounded-lg">Cancel</button>
            <button onClick={handleSingleBlockConfirm} disabled={!!statusChanging[singleBlockTurfId] || batchLoading} className="px-3 py-2 bg-red-600 text-white rounded-lg">Block</button>
          </div>
        </div>
      </Modal>

      {/* Turf Forms */}
      <TurfForm isOpen={showAddTurfModal} onClose={() => setShowAddTurfModal(false)} onTurfAdded={() => { setShowAddTurfModal(false); setCurrentPage(1); fetchTurfs(); }} />
      <TurfForm
        isOpen={showEditTurfModal}
        editingTurf={editingTurf}
        onClose={() => { setShowEditTurfModal(false); setEditingTurf(null); }}
        onTurfAdded={() => { setShowEditTurfModal(false); setEditingTurf(null); setCurrentPage(1); fetchTurfs(); }}
      />
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminTurfsandVenues;
