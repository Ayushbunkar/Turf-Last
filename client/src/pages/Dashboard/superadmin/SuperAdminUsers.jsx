import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users, Search, Download, UserCheck, UserX, Eye, Trash2, Plus,
  Phone, MapPin, Clock, CheckCircle, X, AlertCircle, Shield, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import SuperAdminPageTemplate from './SuperAdminPageTemplate';
import superAdminService from '../../../services/superAdminService';

const usersPerPage = 10;

const statusClasses = {
  active: 'text-green-700 bg-green-100',
  inactive: 'text-red-700 bg-red-100',
  pending: 'text-yellow-700 bg-yellow-100',
  suspended: 'text-purple-700 bg-purple-100',
};

const roleIcons = {
  admin: <Shield className="w-4 h-4 text-purple-500" />,
  turfAdmin: <Shield className="w-4 h-4 text-blue-500" />,
  user: <Users className="w-4 h-4 text-gray-500" />,
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const SuperAdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', location: '', role: 'user', status: 'active' });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        page: currentPage,
        limit: usersPerPage,
        search: searchQuery || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        sortBy,
        sortOrder,
      };
      const data = await superAdminService.getAllUsers(filters);
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedRole, selectedStatus, sortBy, sortOrder]);

  // Fetch stats
  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await superAdminService.getUserStatistics();
      setStatistics(stats || {});
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchStatistics();
  }, [fetchUsers, fetchStatistics]);

  const handleStatusUpdate = async (userId, status) => {
    try {
      await superAdminService.updateUserStatus(userId, { status });
      toast.success(`User ${status}`);
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await superAdminService.deleteUser(userId);
      toast.success('User deleted');
      fetchUsers();
      fetchStatistics();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchStatistics()]);
    setRefreshing(false);
    toast.success('Refreshed');
  };

  const allSelectedOnPage = useMemo(() => users.every(u => selectedUsers.includes(u._id)), [users, selectedUsers]);
  const toggleSelectAllOnPage = (checked) => {
    if (checked) {
      const idsOnPage = users.map(u => u._id);
      setSelectedUsers(prev => Array.from(new Set([...prev, ...idsOnPage])));
    } else {
      const idsOnPage = new Set(users.map(u => u._id));
      setSelectedUsers(prev => prev.filter(id => !idsOnPage.has(id)));
    }
  };

  const renderTableRows = () =>
    users.map(u => (
      <motion.tr key={u._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-4 py-3">
          <input type="checkbox" checked={selectedUsers.includes(u._id)} onChange={e => setSelectedUsers(prev => e.target.checked ? [...prev, u._id] : prev.filter(id => id !== u._id))} className="w-4 h-4" />
        </td>
        <td className="px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">{u.name?.charAt(0) || '?'}</div>
          <div>
            <p className="font-medium text-sm">{u.name}</p>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
        </td>
        <td className="px-4 py-3"><div className="flex items-center gap-2 text-sm">{roleIcons[u.role]} <span className="capitalize">{u.role}</span></div></td>
        <td className="px-4 py-3"><div className={`px-2 py-0.5 text-xs rounded-full ${statusClasses[u.status]}`}>{u.status}</div></td>
        <td className="px-4 py-3 text-sm space-y-1">
          {u.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{u.phone}</div>}
          {u.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{u.location}</div>}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(u.createdAt)}</td>
        <td className="px-4 py-3 text-right flex gap-2 justify-end">
          <button onClick={() => { setSelectedUser(u); setShowUserModal(true); }} className="p-1 rounded hover:bg-gray-100"><Eye className="w-4 h-4" /></button>
          {u.status === 'active' ? (
            <button onClick={() => handleStatusUpdate(u._id, 'inactive')} className="p-1 rounded hover:bg-gray-100"><UserX className="w-4 h-4 text-red-600" /></button>
          ) : (
            <button onClick={() => handleStatusUpdate(u._id, 'active')} className="p-1 rounded hover:bg-gray-100"><UserCheck className="w-4 h-4 text-green-600" /></button>
          )}
          <button onClick={() => { setUserToDelete(u); setShowDeleteModal(true); }} className="p-1 rounded hover:bg-gray-100"><Trash2 className="w-4 h-4 text-red-600" /></button>
        </td>
      </motion.tr>
    ));

  return (
    <SuperAdminPageTemplate>
      <div className="bg-white min-h-full p-6 rounded-xl shadow-sm">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage and monitor all platform users</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={handleRefresh} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50">
              <RefreshCw className={`${refreshing ? 'animate-spin' : ''} w-4 h-4`} /> Refresh
            </button>
            <button onClick={() => superAdminService.exportUsersCSV()} className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <button onClick={() => setShowAddUserModal(true)} className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4 flex gap-2 flex-wrap">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={allSelectedOnPage} onChange={e => toggleSelectAllOnPage(e.target.checked)} />
                </th>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="h-12 bg-gray-100 animate-pulse" /></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">No users found</td></tr>
              ) : renderTableRows()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="p-2 border rounded hover:bg-gray-50"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="p-2 border rounded hover:bg-gray-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        {/* TODO: Modals for view/add/delete user */}
      </div>
    </SuperAdminPageTemplate>
  );
};

export default SuperAdminUsers;
