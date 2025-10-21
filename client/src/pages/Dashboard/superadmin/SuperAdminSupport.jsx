import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Eye,
  MessageCircle,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Send,
  Paperclip,
  Star,
  Tag,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users,
  BarChart3,
  Zap,
  FileText,
  Headphones
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';

const SuperAdminSupport = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tickets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [newReply, setNewReply] = useState('');
  const [ticketStats, setTicketStats] = useState({});
  const [supportAnalytics, setSupportAnalytics] = useState([]);

  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: 0,
    satisfaction: 0,
    agents: 0
  });

  // Stat cards for the top overview (keeps same shape as other superadmin pages)
  const statCards = [
    {
      title: 'Total Tickets',
      value: stats.totalTickets || 0,
      change: stats.changeTotal ? (stats.changeTotal > 0 ? `+${stats.changeTotal}` : `${stats.changeTotal}`) : '0',
      changeType: (stats.changeTotal || 0) >= 0 ? 'increase' : 'decrease',
      icon: MessageCircle,
      color: 'blue'
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets || 0,
      change: stats.changePending ? (stats.changePending > 0 ? `+${stats.changePending}` : `${stats.changePending}`) : '0',
      changeType: (stats.changePending || 0) >= 0 ? 'increase' : 'decrease',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      title: 'Resolved',
      value: stats.resolvedTickets || 0,
      change: stats.changeResolved ? (stats.changeResolved > 0 ? `+${stats.changeResolved}` : `${stats.changeResolved}`) : '0',
      changeType: (stats.changeResolved || 0) >= 0 ? 'increase' : 'decrease',
      icon: CheckCircle,
      color: 'green'
    },
    {
      title: 'Agents',
      value: stats.agents || 0,
      change: '0',
      changeType: 'increase',
      icon: Users,
      color: 'purple'
    }
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, searchTerm, statusFilter, priorityFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined
      };

      // Fetch support tickets
      const response = await superAdminService.getSupportTickets(params);
      setTickets(response.data || []);
      setTotalPages(response.totalPages || 1);


        // Fetch real support analytics for stat cards
        const analytics = await superAdminService.getSupportAnalytics();
        setStats({
          totalTickets: analytics.totalCurrent,
          openTickets: analytics.pendingCurrent,
          resolvedTickets: analytics.resolvedCurrent,
          urgentTickets: analytics.urgentCurrent,
          // You can add more fields if needed
          changeTotal: analytics.totalCurrent - analytics.totalPrev,
          changeResolved: analytics.resolvedCurrent - analytics.resolvedPrev,
          changePending: analytics.pendingCurrent - analytics.pendingPrev,
          changeUrgent: analytics.urgentCurrent - analytics.urgentPrev
        });

    } catch (error) {
      console.error("Error fetching support data:", error);
      toast.error("Failed to load support data. Please try again.");
      
      // Set empty data on error
      setTickets([]);
      setStats({
        totalTickets: 0,
        openTickets: 0,
        resolvedTickets: 0,
        avgResponseTime: 0,
        satisfaction: 0,
        agents: 0
      });
      setSupportAnalytics([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      await superAdminService.updateTicketStatus(ticketId, newStatus);
      toast.success("Ticket status updated successfully");
      fetchData();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      toast.error("Failed to update ticket status");
    }
  };

  const handleAssignTicket = async (ticketId, agentId) => {
    try {
      await superAdminService.assignTicket(ticketId, agentId);
      toast.success("Ticket assigned successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to assign ticket");
    }
  };

  const handleReplyToTicket = async () => {
    if (!newReply.trim()) return;
    
    try {
      await superAdminService.replyToTicket(selectedTicket.id, { message: newReply });
      toast.success("Reply sent successfully");
      setNewReply('');
      fetchData();
      // Update selected ticket responses count
      setSelectedTicket({ 
        ...selectedTicket, 
        responses: selectedTicket.responses + 1,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      toast.error("Failed to send reply");
    }
  };

  const handleSeedData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/super-admin/seed-support-tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        toast.success('Sample support tickets created successfully!');
        fetchData();
      } else {
        toast.error('Failed to seed support tickets');
      }
    } catch (error) {
      toast.error('Failed to seed support tickets');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
      'in-progress': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.open;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const priorityConfig = {
      low: { color: 'bg-blue-100 text-blue-800', icon: ArrowDown },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: MoreHorizontal },
      high: { color: 'bg-red-100 text-red-800', icon: ArrowUp },
      urgent: { color: 'bg-purple-100 text-purple-800', icon: Zap }
    };
    
    const config = priorityConfig[priority] || priorityConfig.medium;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    );
  };

  const getCategoryIcon = (category) => {
    const icons = {
      technical: <AlertTriangle className="w-4 h-4 text-orange-500" />,
      payment: <FileText className="w-4 h-4 text-green-500" />,
      billing: <BarChart3 className="w-4 h-4 text-blue-500" />,
      general: <MessageCircle className="w-4 h-4 text-gray-500" />,
      account: <User className="w-4 h-4 text-purple-500" />
    };
    return icons[category] || icons.general;
  };

          {/* Stats Cards */}
          {/* ...existing code... */}
  // Stat cards array (move here, outside JSX)
          {/* Stats Cards */}

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (loading && tickets.length === 0) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SuperAdminSidebar />
      <div className="flex-1 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading support system...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SuperAdminSidebar />
      
      <div className="flex-1 lg:ml-80">
        <SuperAdminNavbar />
        
        <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Support Management</h1>
              <p className="text-gray-600 mt-1">Manage customer support tickets and inquiries</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Create Ticket</span>
              </button>
            </div>
          </div>

          {/* Stats Cards Rendering */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, idx) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-start justify-between"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${card.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <Icon className="w-6 h-6" />
                    </span>
                    <span className="text-2xl font-bold text-gray-900">{card.value}</span>
                  </div>
                  <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                  <div className="flex items-center mt-2">
                    {card.changeType === 'increase' ? (
                      <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`font-semibold ${card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>{card.change}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'tickets', label: 'Support Tickets', icon: MessageSquare },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                  { id: 'agents', label: 'Agents', icon: Headphones }
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Filters */}
            {activeTab === 'tickets' && (
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'tickets' && (
                <>
                  {filteredTickets.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Support Tickets</h3>
                      <p className="text-gray-600 mb-4">
                        {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                          ? 'No tickets match your current filters.'
                          : 'There are no support tickets yet. They will appear here when users submit support requests.'}
                      </p>
                      {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && tickets.length === 0 && (
                        <button
                          onClick={handleSeedData}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Sample Tickets
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ticket
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status & Priority
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTickets.map((ticket, index) => (
                        <motion.tr
                          key={ticket.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                {getCategoryIcon(ticket.category)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900">
                                  #{ticket.id} {ticket.subject}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {ticket.description && ticket.description.length > 60 
                                    ? `${ticket.description.substring(0, 60)}...`
                                    : (ticket.description || 'No description')
                                  }
                                </div>
                                <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                                  <span className="flex items-center">
                                    <MessageCircle className="w-3 h-3 mr-1" />
                                    {ticket.responses || 0} responses
                                  </span>
                                  {ticket.rating && (
                                    <span className="flex items-center">
                                      <Star className="w-3 h-3 mr-1 text-yellow-400" />
                                      {ticket.rating}/5
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">
                                  {ticket.user.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {ticket.user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              {getStatusBadge(ticket.status)}
                              {getPriorityBadge(ticket.priority)}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {ticket.assignedTo || (
                                <span className="text-gray-400 italic">Unassigned</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(ticket.updatedAt).toLocaleDateString()}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setShowTicketModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setShowTicketModal(true);
                                }}
                                className="text-green-600 hover:text-green-900"
                                title="Reply"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              <select
                                onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                value={ticket.status}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="open">Open</option>
                                <option value="in-progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                  )}
                </>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Support Analytics Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Volume (7 Days)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={supportAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="tickets" stroke="#3B82F6" strokeWidth={2} name="New Tickets" />
                          <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolved" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time Trends</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={supportAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="avgTime" fill="#F59E0B" name="Avg Response Time (hours)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'agents' && (
                <div className="space-y-6">
                  <div className="text-center py-12">
                    <Headphones className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Agent Management</h3>
                    <p className="text-gray-600">Manage support agents, their performance, and workload distribution.</p>
                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Add New Agent
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {activeTab === 'tickets' && totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex justify-between items-center w-full">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {showTicketModal && selectedTicket && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Ticket #{selectedTicket.id}: {selectedTicket.subject}
                    </h3>
                    <div className="flex items-center space-x-4 mt-2">
                      {getStatusBadge(selectedTicket.status)}
                      {getPriorityBadge(selectedTicket.priority)}
                      <span className="text-sm text-gray-500">
                        Created: {new Date(selectedTicket.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Customer Info */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Customer Information</h4>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{selectedTicket.user.name}</div>
                        <div className="text-sm text-gray-600">{selectedTicket.user.email}</div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Description */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Response Section */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Responses ({selectedTicket.responses})</h4>
                    
                    {/* Mock conversation - in real app, this would come from API */}
                    <div className="space-y-4 mb-6">
                      <div className="flex space-x-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 bg-blue-50 p-3 rounded-lg">
                          <div className="text-sm text-blue-900 font-medium">{selectedTicket.user.name}</div>
                          <div className="text-sm text-blue-800 mt-1">Original ticket description...</div>
                          <div className="text-xs text-blue-600 mt-2">
                            {new Date(selectedTicket.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      {selectedTicket.assignedTo && (
                        <div className="flex space-x-3">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Headphones className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 bg-green-50 p-3 rounded-lg">
                            <div className="text-sm text-green-900 font-medium">{selectedTicket.assignedTo}</div>
                            <div className="text-sm text-green-800 mt-1">Thanks for reaching out! I'm looking into this issue now...</div>
                            <div className="text-xs text-green-600 mt-2">
                              {new Date(selectedTicket.updatedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reply Input */}
                    <div className="border-t pt-4">
                      <div className="flex space-x-3">
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <Headphones className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows="3"
                            placeholder="Type your reply..."
                          />
                          <div className="flex items-center justify-between mt-3">
                            <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800">
                              <Paperclip className="w-4 h-4" />
                              <span className="text-sm">Attach file</span>
                            </button>
                            <button
                              onClick={handleReplyToTicket}
                              disabled={!newReply.trim()}
                              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Send className="w-4 h-4" />
                              <span>Send Reply</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminSupport;