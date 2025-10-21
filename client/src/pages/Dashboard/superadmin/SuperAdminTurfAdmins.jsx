import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Users, UserPlus, Search, Eye, Edit, Trash2, CheckCircle, XCircle,
  Clock, Unlock, Star
} from "lucide-react";
import SuperAdminPageTemplate from './SuperAdminPageTemplate'; // your template
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const SuperAdminTurfAdminsPage = () => {
  const [turfAdmins, setTurfAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editAdmin, setEditAdmin] = useState(null);
  const [newAdmin, setNewAdmin] = useState({ name:'', email:'', password:'', phone:'', address:'' });
  const [stats, setStats] = useState({ total:0, active:0, pending:0, blocked:0, totalTurfs:0, avgRating:0 });

  const pieData = [
    { name: 'Active', value: stats.active },
    { name: 'Pending', value: stats.pending },
    { name: 'Blocked', value: stats.blocked }
  ];
  const COLORS = ['#34d399', '#fbbf24', '#ef4444'];
  const barData = [
    { name: 'Admins', value: stats.total },
    { name: 'Turfs Managed', value: stats.totalTurfs }
  ];

  useEffect(() => {
    fetchTurfAdmins();
    fetchStats();
  }, [currentPage, searchTerm, statusFilter]);

  const fetchTurfAdmins = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      };
      const res = await superAdminService.getTurfAdmins(params);
      setTurfAdmins(res.turfAdmins || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await superAdminService.getTurfAdminStats();
      const safeNum = v => v == null ? 0 : Number(v) || 0;
      setStats({
        total: safeNum(res?.totalTurfAdmins ?? res?.total),
        active: safeNum(res?.activeTurfAdmins ?? res?.active),
        pending: safeNum(res?.pendingTurfAdmins ?? res?.pending),
        blocked: safeNum(res?.blockedTurfAdmins ?? res?.blocked),
        totalTurfs: safeNum(res?.totalTurfs),
        avgRating: safeNum(res?.avgRating),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) return toast.error("Name, email, password required");
    try {
      await superAdminService.createTurfAdmin(newAdmin);
      toast.success("Admin created");
      setShowCreateModal(false);
      setNewAdmin({ name:'', email:'', password:'', phone:'', address:'' });
      fetchTurfAdmins();
      fetchStats();
    } catch {
      toast.error("Failed to create admin");
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      blocked: { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = map[status] || map.pending;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}><Icon className="w-3 h-3 mr-1"/>{status.charAt(0).toUpperCase()+status.slice(1)}</span>;
  };

  const statCards = [
    { title: "Total Turf Admins", value: stats.total, icon: Shield, color: "blue" },
    { title: "Active Admins", value: stats.active, icon: CheckCircle, color: "green" },
    { title: "Pending Admins", value: stats.pending, icon: Clock, color: "yellow" },
    { title: "Total Turfs Managed", value: stats.totalTurfs, icon: Users, color: "purple" },
    { title: "Average Rating", value: stats.avgRating.toFixed(1), icon: Star, color: "orange" }
  ];

  return (
    <SuperAdminPageTemplate>
      <div className="bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-extrabold text-gray-900">Super Admin Dashboard: Turf Admins</h1>

        {/* Stats Cards */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Stats Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {statCards.map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-xl shadow flex flex-col justify-between hover:shadow-lg transition">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                  <p className="mt-1 text-xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <card.icon className={`w-6 h-6 text-${card.color}-500`}/>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow">
            <h4 className="text-gray-700 font-medium mb-2">Admins Status Distribution</h4>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                  {pieData.map((entry, idx) => <Cell key={idx} fill={COLORS[idx%COLORS.length]} />)}
                </Pie>
                <Tooltip/>
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded-xl shadow">
            <h4 className="text-gray-700 font-medium mb-2">Admins vs Turfs</h4>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3"/>
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="value" fill="#3b82f6"/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters & Add Button */}
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Turf Admins List</h2>
        <div className="flex flex-col sm:flex-row justify-between gap-2 items-center mb-4">
          <div className="flex gap-2 w-full sm:w-auto">
            <input type="text" placeholder="Search admins" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="px-3 py-2 rounded border w-full sm:w-64"/>
            <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className="px-3 py-2 rounded border">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <button onClick={()=>setShowCreateModal(true)} className="px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-1"><UserPlus className="w-4 h-4"/> Add Admin</button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created At</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-4">Loading...</td></tr>
              ) : turfAdmins.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-4">No admins found</td></tr>
              ) : turfAdmins.map(admin => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{admin.name}</td>
                  <td className="px-4 py-2">{admin.email}</td>
                  <td className="px-4 py-2">{admin.phone}</td>
                  <td className="px-4 py-2">{getStatusBadge(admin.status)}</td>
                  <td className="px-4 py-2">{new Date(admin.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right flex justify-end gap-2">
                    <button onClick={()=>{setSelectedAdmin(admin);setShowViewModal(true);}} className="p-1 bg-gray-100 rounded" title="View"><Eye className="w-4 h-4"/></button>
                    <button onClick={()=>{setEditAdmin(admin);setShowEditModal(true);}} className="p-1 bg-gray-100 rounded" title="Edit"><Edit className="w-4 h-4"/></button>
                    <button onClick={()=>{setSelectedAdmin(admin);setShowDeleteModal(true);}} className="p-1 bg-red-100 rounded" title="Delete"><Trash2 className="w-4 h-4 text-red-600"/></button>
                    {admin.status==='blocked' && <button onClick={()=>{/* unblock logic here */}} className="p-1 bg-green-100 rounded" title="Unblock"><Unlock className="w-4 h-4 text-green-600"/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modals outside table to avoid hydration error */}
        <AnimatePresence>
          {showViewModal && selectedAdmin && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Turf Admin Details</h3>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedAdmin.name}</div>
                  <div><strong>Email:</strong> {selectedAdmin.email}</div>
                  <div><strong>Phone:</strong> {selectedAdmin.phone}</div>
                  <div><strong>Address:</strong> {selectedAdmin.address}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedAdmin.status)}</div>
                  <div><strong>Created At:</strong> {new Date(selectedAdmin.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={()=>setShowViewModal(false)} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Modals outside table to avoid hydration error */}
        <AnimatePresence>
          {showViewModal && selectedAdmin && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Turf Admin Details</h3>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedAdmin.name}</div>
                  <div><strong>Email:</strong> {selectedAdmin.email}</div>
                  <div><strong>Phone:</strong> {selectedAdmin.phone}</div>
                  <div><strong>Address:</strong> {selectedAdmin.address}</div>
                  <div><strong>Status:</strong> {getStatusBadge(selectedAdmin.status)}</div>
                  <div><strong>Created At:</strong> {new Date(selectedAdmin.createdAt).toLocaleDateString()}</div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={()=>setShowViewModal(false)} className="px-4 py-2 bg-gray-200 rounded">Close</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showEditModal && editAdmin && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Edit Turf Admin</h3>
                <div className="flex flex-col gap-2">
                  <input type="text" placeholder="Name" value={editAdmin.name || ''} onChange={e=>setEditAdmin({...editAdmin, name:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="email" placeholder="Email" value={editAdmin.email || ''} onChange={e=>setEditAdmin({...editAdmin, email:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="text" placeholder="Address" value={editAdmin.address || ''} onChange={e=>setEditAdmin({...editAdmin, address:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="text" placeholder="Phone" value={editAdmin.phone || ''} onChange={e=>setEditAdmin({...editAdmin, phone:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="password" placeholder="Password" value={editAdmin.password || ''} onChange={e=>setEditAdmin({...editAdmin, password:e.target.value})} className="px-3 py-2 border rounded"/>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={()=>setShowEditModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button onClick={async()=>{
                    try {
                      const payload = {
                        name: editAdmin.name,
                        email: editAdmin.email,
                        address: editAdmin.address,
                        phone: editAdmin.phone,
                        password: editAdmin.password
                      };
                      await superAdminService.updateTurfAdmin(editAdmin.id, payload);
                      toast.success("Admin updated");
                      setShowEditModal(false);
                      fetchTurfAdmins();
                    } catch {
                      toast.error("Failed to update admin");
                    }
                  }} className="px-4 py-2 bg-blue-500 text-white rounded">Save</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showDeleteModal && selectedAdmin && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h3 className="text-lg font-medium mb-4 text-red-600">Delete Turf Admin</h3>
                <p>Are you sure you want to delete <strong>{selectedAdmin.name}</strong>?</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={()=>setShowDeleteModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button onClick={async()=>{
                    try {
                      await superAdminService.deleteTurfAdmin(selectedAdmin.id);
                      toast.success("Admin deleted");
                      setShowDeleteModal(false);
                      fetchTurfAdmins();
                    } catch {
                      toast.error("Failed to delete admin");
                    }
                  }} className="px-4 py-2 bg-red-500 text-white rounded">Delete</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showCreateModal && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl w-full max-w-md">
                <h3 className="text-lg font-medium mb-4">Create Turf Admin</h3>
                <div className="flex flex-col gap-2">
                  <input type="text" placeholder="Name" value={newAdmin.name} onChange={e=>setNewAdmin({...newAdmin, name:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="email" placeholder="Email" value={newAdmin.email} onChange={e=>setNewAdmin({...newAdmin, email:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="password" placeholder="Password" value={newAdmin.password} onChange={e=>setNewAdmin({...newAdmin, password:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="text" placeholder="Phone" value={newAdmin.phone} onChange={e=>setNewAdmin({...newAdmin, phone:e.target.value})} className="px-3 py-2 border rounded"/>
                  <input type="text" placeholder="Address" value={newAdmin.address} onChange={e=>setNewAdmin({...newAdmin, address:e.target.value})} className="px-3 py-2 border rounded"/>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={()=>setShowCreateModal(false)} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
                  <button onClick={handleCreateAdmin} className="px-4 py-2 bg-blue-500 text-white rounded">Create</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      {/* End modals */}
    </div>
  </SuperAdminPageTemplate>
  );
};

export default SuperAdminTurfAdminsPage;
