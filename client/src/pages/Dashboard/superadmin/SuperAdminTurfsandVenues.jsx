
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
} from "lucide-react";

import SuperAdminPageTemplate from './SuperAdminPageTemplate';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';
import TurfForm from '../TurfAdminDashboard/TurfForm';

const PLACEHOLDER = "https://via.placeholder.com/400x300?text=No+Image";

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

  useEffect(() => {
    const fetchTurfs = async () => {
      setLoading(true);
      try {
        const res = await superAdminService.getAllTurfs({
          page: currentPage,
          limit: 12,
          search: searchTerm,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          sortBy,
        });
        setTurfs(res.turfs || []);
        setTotalPages(res.pagination?.totalPages || 1);
      } catch {
        setTurfs([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchTurfs();
  }, [currentPage, searchTerm, statusFilter, categoryFilter, sortBy]);

  const handleDelete = async (turfId) => {
    try {
      await superAdminService.deleteTurf(turfId);
      toast.success("Turf deleted");
      setShowDeleteModal(false);
      setSelectedTurf(null);
      setCurrentPage(1);
    } catch {
      toast.error("Failed to delete");
    }
  };

  const statCards = [
    { title: 'Total Turfs', value: turfs.length, icon: Building, color: 'blue', description: 'Total number of turfs.' },
    { title: 'Active Turfs', value: turfs.filter(t => t.status === 'active').length, icon: CheckCircle, color: 'green', description: 'Currently active turfs.' },
    { title: 'Pending Turfs', value: turfs.filter(t => t.status === 'pending').length, icon: Clock, color: 'yellow', description: 'Turfs pending approval.' },
    { title: 'Blocked Turfs', value: turfs.filter(t => t.status === 'blocked').length, icon: XCircle, color: 'purple', description: 'Blocked or inactive turfs.' },
  ];

  return (
    <SuperAdminPageTemplate title="Turfs & Venues" subtitle="Manage all turfs, venues and operations">
      {/* Main white container */}
      <div className="bg-white rounded-2xl p-6 shadow-lg w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-3">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Turfs & Venues Management</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all turfs, venues and their operations</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCurrentPage(1)} className="flex items-center px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
              <RefreshCw className="w-4 h-4" /><span className="ml-1 hidden sm:inline">Refresh</span>
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

        {/* Turfs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf, index) => (
            <motion.div
              key={turf._id || turf.id || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-50 rounded-xl overflow-hidden shadow-sm border border-gray-100"
            >
              {/* Turf Image */}
              <div className="relative h-48 overflow-hidden">
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
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{turf.name}</h3>
                <div className="flex items-center text-gray-600 mb-2"><MapPin className="w-4 h-4 mr-2" />{turf.location}</div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">{turf.category}</span>
                  <span className="text-lg font-bold text-blue-600 flex items-center"><span className="mr-1">₹</span>{turf.pricePerHour}/hr</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <Calendar className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">{turf.totalBookings || 0}</div>
                    <div className="text-xs text-gray-500">Bookings</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <IndianRupee className="w-4 h-4 text-gray-600 mx-auto mb-1" />
                    <div className="text-sm font-medium text-gray-900">{turf.revenue || 0}</div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <button onClick={() => { setSelectedTurf(turf); setShowDetailsModal(true); }} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingTurf(turf); setShowEditTurfModal(true); }} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      <Edit className="w-4 h-4" /> Edit
                    </button>
                    <button onClick={() => { setSelectedTurf(turf); setShowDeleteModal(true); }} className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>

      {/* Modals */}
      <TurfDetailsModal turf={selectedTurf} isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} />
      <DeleteModal turf={selectedTurf} isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDelete} />

      {/* Turf Forms */}
      <TurfForm isOpen={showAddTurfModal} onClose={() => setShowAddTurfModal(false)} onTurfAdded={() => { setShowAddTurfModal(false); setCurrentPage(1); }} />
      <TurfForm
        isOpen={showEditTurfModal}
        editingTurf={editingTurf}
        onClose={() => { setShowEditTurfModal(false); setEditingTurf(null); }}
        onTurfAdded={() => { setShowEditTurfModal(false); setEditingTurf(null); setCurrentPage(1); }}
      />
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminTurfsandVenues;
