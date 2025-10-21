import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Eye,
  Trash2,
  Plus,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import SuperAdminSidebar from '../../../components/Sidebar/SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import toast from 'react-hot-toast';
import superAdminService from '../../../services/superAdminService';

const usersPerPage = 10;

const statusClasses = {
  active: 'text-green-700 bg-green-100',
  inactive: 'text-red-700 bg-red-100',
  pending: 'text-yellow-700 bg-yellow-100',
  approved: 'text-blue-700 bg-blue-100',
  suspended: 'text-purple-700 bg-purple-100',
};

const roleIcons = {
  admin: <Shield className="w-4 h-4 text-purple-500" />,
  turfAdmin: <Shield className="w-4 h-4 text-blue-500" />,
  user: <Users className="w-4 h-4 text-gray-500" />,
};

const statusIcons = {
  active: <CheckCircle className="w-4 h-4 text-green-500" />,
  inactive: <X className="w-4 h-4 text-red-500" />,
  pending: <Clock className="w-4 h-4 text-yellow-500" />,
  suspended: <AlertCircle className="w-4 h-4 text-purple-500" />,
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

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
  const [showFilters, setShowFilters] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState('');
  const [newUser, setNewUser] = useState({ name: '', email: '', phone: '', location: '', role: 'user', status: 'active' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // fetch users
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
        sortOrder
      };
      const data = await superAdminService.getAllUsers(filters);
      // Expected response: { users: [...], pagination: { totalPages, totalItems, page } }
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err) {
      console.error('fetchUsers', err);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, selectedRole, selectedStatus, sortBy, sortOrder]);

  const fetchStatistics = useCallback(async () => {
    try {
      const stats = await superAdminService.getUserStatistics();
      setStatistics(stats || {});
    } catch (err) {
      console.error('fetchStatistics', err);
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
      console.error(err);
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
      console.error(err);
      toast.error('Failed to delete user');
    }
  };

  const handleBulkAction = async (action) => {
    if (!selectedUsers.length) return toast.error('Select users');
    try {
      await Promise.all(
        selectedUsers.map((id) => {
          if (action === 'delete') return superAdminService.deleteUser(id);
          return superAdminService.updateUserStatus(id, { status: action });
        })
      );
      toast.success('Bulk action applied');
      setSelectedUsers([]);
      fetchUsers();
      fetchStatistics();
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply bulk action');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsers(), fetchStatistics()]);
    setRefreshing(false);
    toast.success('Refreshed');
  };

  // master checkbox logic
  const allSelectedOnPage = useMemo(() => {
    if (!users || users.length === 0) return false;
    return users.every((u) => selectedUsers.includes(u._id));
  }, [users, selectedUsers]);

  const toggleSelectAllOnPage = (checked) => {
    if (checked) {
      const idsOnPage = users.map((u) => u._id);
      // union to keep any selected from other pages
      const union = Array.from(new Set([...selectedUsers, ...idsOnPage]));
      setSelectedUsers(union);
    } else {
      // remove current page ids from selection
      const idsOnPage = new Set(users.map((u) => u._id));
      setSelectedUsers(selectedUsers.filter((id) => !idsOnPage.has(id)));
    }
  };

  // small helper for rendering rows (desktop)
  const renderTableRows = () =>
    users.map((u) => (
      <motion.tr
        key={u._id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="border-b border-gray-100 hover:bg-gray-50"
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <input
            type="checkbox"
            checked={selectedUsers.includes(u._id)}
            onChange={(e) =>
              setSelectedUsers((prev) =>
                e.target.checked ? [...prev, u._id] : prev.filter((id) => id !== u._id)
              )
            }
            className="w-4 h-4"
            aria-label={`Select ${u.name}`}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
              {u.name?.charAt(0) || '?'}
            </div>
            <div>
              <p className="font-medium text-sm">{u.name}</p>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2 text-sm">{roleIcons[u.role]} <span className="capitalize">{u.role}</span></div>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {statusIcons[u.status]}
            <span className={`px-2 py-0.5 text-xs rounded-full ${statusClasses[u.status]}`}>{u.status}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-sm">
          <div className="space-y-1">
            {u.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</div>}
            {u.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {u.location}</div>}
          </div>
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(u.createdAt)}</td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => {
                setSelectedUser(u);
                setShowUserModal(true);
              }}
              aria-label={`View ${u.name}`}
              title="View"
              className="p-1 rounded hover:bg-gray-100"
            >
              <Eye className="w-4 h-4" />
            </button>
            {u.status === 'active' ? (
              <button onClick={() => handleStatusUpdate(u._id, 'inactive')} title="Deactivate" className="p-1 rounded hover:bg-gray-100">
                <UserX className="w-4 h-4 text-red-600" />
              </button>
            ) : (
              <button onClick={() => handleStatusUpdate(u._id, 'active')} title="Activate" className="p-1 rounded hover:bg-gray-100">
                <UserCheck className="w-4 h-4 text-green-600" />
              </button>
            )}
            <button
              onClick={() => {
                setUserToDelete(u);
                setShowDeleteModal(true);
              }}
              title="Delete"
              className="p-1 rounded hover:bg-gray-100"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </td>
      </motion.tr>
    ));

  return (
    <div className="flex lg:-ml-10 flex-col lg:flex-row min-h-screen bg-gray-50">
      {/* Mobile overlay for sidebar */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <SuperAdminSidebar isMobileOpen={isMobileSidebarOpen} onMobileClose={() => setIsMobileSidebarOpen(false)} />

      {/* Main */}
      <div className="flex-1 lg:ml-80 flex flex-col">
        <SuperAdminNavbar onMobileMenuToggle={() => setIsMobileSidebarOpen((s) => !s)} />

        <main className="p-3 sm:p-6 pt-28 sm:pt-24 flex-1 overflow-hidden">
          {/* Header + actions */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-sm text-gray-600 mt-1">Manage and monitor all platform users</p>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-60 w-full sm:w-auto justify-center"
              >
                <RefreshCw className={`${refreshing ? 'animate-spin' : ''} w-4 h-4`} /> Refresh
              </button>

              <button
                onClick={() => superAdminService.exportUsersCSV()}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto justify-center"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
      {/* Add User Modal */}
      <AnimatePresence>
        {showAddUserModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Add New User</h2>
                <button onClick={() => setShowAddUserModal(false)} aria-label="Close add user"><X className="w-6 h-6" /></button>
              </div>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddUserLoading(true);
                  setAddUserError('');
                  try {
                    await superAdminService.createUser(newUser);
                    toast.success('User created');
                    setShowAddUserModal(false);
                    setNewUser({ name: '', email: '', phone: '', location: '', role: 'user', status: 'active' });
                    fetchUsers();
                    fetchStatistics();
                  } catch (err) {
                    setAddUserError(err?.response?.data?.error || 'Failed to create user');
                  } finally {
                    setAddUserLoading(false);
                  }
                }}
                className="space-y-3"
              >
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={newUser.name}
                  onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="email"
                  required
                  placeholder="Email"
                  value={newUser.email}
                  onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={newUser.phone}
                  onChange={e => setNewUser(u => ({ ...u, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={newUser.location}
                  onChange={e => setNewUser(u => ({ ...u, location: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <select
                  value={newUser.role}
                  onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="user">User</option>
                  <option value="turfAdmin">Turf Admin</option>
                  <option value="admin">Admin</option>
                </select>
                <select
                  value={newUser.status}
                  onChange={e => setNewUser(u => ({ ...u, status: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                {addUserError && <p className="text-red-600 text-sm">{addUserError}</p>}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                  <button type="submit" disabled={addUserLoading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">{addUserLoading ? 'Adding...' : 'Add User'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total Users', value: statistics.totalUsers, icon: <Users className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-100' },
              { label: 'Active Users', value: statistics.activeUsers, icon: <CheckCircle className="w-5 h-5 text-green-600" />, bg: 'bg-green-100' },
              { label: 'Pending Approval', value: statistics.pendingUsers, icon: <Clock className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-100' },
              { label: 'Turf Admins', value: statistics.turfAdmins, icon: <Shield className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-100' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>{stat.icon}</div>
                <div>
                  <p className="text-base sm:text-xl font-bold text-gray-900">{stat.value?.toLocaleString() || '0'}</p>
                  <p className="text-gray-600 text-xs sm:text-sm">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 p-4">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <div className="flex items-center relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowFilters((s) => !s)}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 w-full sm:w-auto justify-center"
                >
                  <Filter className="w-4 h-4" /> Filters <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {selectedUsers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedUsers.length} selected</span>
                    <button onClick={() => handleBulkAction('active')} className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-sm">Activate</button>
                    <button onClick={() => handleBulkAction('inactive')} className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-sm">Deactivate</button>
                    <button onClick={() => handleBulkAction('delete')} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm">Delete</button>
                  </div>
                )}
              </div>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-200">
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="px-3 py-2 border rounded-lg">
                      <option value="">All Roles</option>
                      <option value="user">User</option>
                      <option value="turfAdmin">Turf Admin</option>
                      <option value="admin">Admin</option>
                    </select>
                    <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="px-3 py-2 border rounded-lg">
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 border rounded-lg">
                      <option value="createdAt">Date Created</option>
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="lastLogin">Last Login</option>
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="px-3 py-2 border rounded-lg">
                      <option value="desc">Descending</option>
                      <option value="asc">Ascending</option>
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User list container */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={allSelectedOnPage}
                        onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                      />
                    </th>
                    <th className="px-4 py-3 text-left">User</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Contact</th>
                    <th className="px-4 py-3 text-left">Joined</th>
                    <th className="px-4 py-3 text-left">Last Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="h-12 bg-gray-100 animate-pulse" />
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-500">No users found</td>
                    </tr>
                  ) : (
                    renderTableRows()
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="h-12 bg-gray-100 animate-pulse rounded" />
                  </div>
                ))
              ) : users.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No users found</p>
              ) : (
                users.map((u) => (
                  <div key={u._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                          {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusClasses[u.status]}`}>{u.status}</span>
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        {roleIcons[u.role]} <span className="capitalize">{u.role}</span>
                      </div>
                      {u.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {u.phone}</div>}
                      {u.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {u.location}</div>}
                      <div>Joined: {formatDate(u.createdAt)}</div>
                      <div>Last Login: {u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</div>
                    </div>

                    <div className="flex justify-end gap-3 pt-3">
                      <button onClick={() => { setSelectedUser(u); setShowUserModal(true); }} className="p-2 rounded hover:bg-gray-100">
                        <Eye className="w-4 h-4" />
                      </button>
                      {u.status === 'active' ? (
                        <button onClick={() => handleStatusUpdate(u._id, 'inactive')} className="p-2 rounded hover:bg-gray-100">
                          <UserX className="w-4 h-4 text-red-600" />
                        </button>
                      ) : (
                        <button onClick={() => handleStatusUpdate(u._id, 'active')} className="p-2 rounded hover:bg-gray-100">
                          <UserCheck className="w-4 h-4 text-green-600" />
                        </button>
                      )}
                      <button onClick={() => { setUserToDelete(u); setShowDeleteModal(true); }} className="p-2 rounded hover:bg-gray-100">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap justify-between items-center p-4 border-t border-gray-200 gap-2">
                <span className="text-sm">Page {currentPage} of {totalPages}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 border rounded-md disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* show up to 5 page buttons centered around current */}
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const midpoint = Math.max(1, currentPage - 2);
                    const pageNum = midpoint + i;
                    if (pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-2 py-1 rounded-md ${currentPage === pageNum ? 'bg-blue-600 text-white' : 'border'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 border rounded-md disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* User Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">User Details</h2>
                <button onClick={() => setShowUserModal(false)} aria-label="Close user details"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">{selectedUser.name?.charAt(0)}</div>
                <div>
                  <h3 className="font-semibold">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {roleIcons[selectedUser.role]}
                    <span className="capitalize">{selectedUser.role}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${statusClasses[selectedUser.status]}`}>{selectedUser.status}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Contact Info</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> {selectedUser.email}</div>
                    {selectedUser.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> {selectedUser.phone}</div>}
                    {selectedUser.location && <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {selectedUser.location}</div>}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Account Info</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Joined: {formatDate(selectedUser.createdAt)}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4" /> Last Login: {selectedUser.lastLogin ? formatDate(selectedUser.lastLogin) : 'Never'}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setShowUserModal(false)} className="px-4 py-2 border rounded-lg">Close</button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Edit User</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {showDeleteModal && userToDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div initial={{ scale: 0.96 }} animate={{ scale: 1 }} exit={{ scale: 0.96 }} className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center"><AlertCircle className="w-6 h-6 text-red-600" /></div>
                <div>
                  <h3 className="font-semibold">Delete User</h3>
                  <p className="text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <p className="mb-6">Are you sure you want to delete <strong>{userToDelete.name}</strong>?</p>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 border rounded-lg">Cancel</button>
                <button onClick={() => handleDelete(userToDelete._id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminUsers;
