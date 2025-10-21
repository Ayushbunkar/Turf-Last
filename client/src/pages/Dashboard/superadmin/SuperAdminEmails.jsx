import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Send,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Eye,
  Copy,
  Users,
  Calendar,
  BarChart3,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  FileText,
  MessageSquare,
  Target,
  Settings,
  Download,
  TrendingUp
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SuperAdminSidebar from './SuperAdminSidebar';
import SuperAdminNavbar from './SuperAdminNavbar';
import superAdminService from '../../../services/superAdminService';
import toast from 'react-hot-toast';

const SuperAdminEmails = () => {
  const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('campaigns');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState('campaign'); // 'campaign' or 'template'

  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    target: 'all',
    scheduledAt: '',
    templateId: ''
  });

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    content: '',
    category: 'general'
  });

  const [stats, setStats] = useState({
    totalCampaigns: 0,
    sentEmails: 0,
    openRate: 0,
    clickRate: 0,
    templates: 0,
    subscribers: 0
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage, searchTerm, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch email data
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };

      if (activeTab === 'campaigns') {
        const response = await superAdminService.getEmailCampaigns(params);
        setCampaigns(response.data || []);
        setTotalPages(response.totalPages || 1);
      } else if (activeTab === 'templates') {
        const response = await superAdminService.getEmailTemplates(params);
        setTemplates(response.data || []);
        setTotalPages(response.totalPages || 1);
      } else if (activeTab === 'analytics') {
        const response = await superAdminService.getEmailAnalytics();
        setAnalytics(response.data || []);
      }

      // Fetch stats
      const statsResponse = await superAdminService.getEmailStats();
      setStats(statsResponse || stats);

    } catch (error) {
      console.error("Error fetching email data:", error);
      toast.error("Failed to load email data. Please try again.");
      
      // Set empty data on error
      setCampaigns([]);
      setTemplates([]);
      setAnalytics([]);
      setStats({
        totalCampaigns: 0,
        sentEmails: 0,
        openRate: 0,
        clickRate: 0,
        templates: 0,
        subscribers: 0
      });
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      await superAdminService.createEmailCampaign(newCampaign);
      toast.success("Email campaign created successfully");
      setShowCreateModal(false);
      resetNewCampaign();
      fetchData();
    } catch (error) {
      toast.error("Failed to create campaign");
    }
  };

  const handleCreateTemplate = async () => {
    try {
      await superAdminService.createEmailTemplate(newTemplate);
      toast.success("Email template created successfully");
      setShowCreateModal(false);
      resetNewTemplate();
      fetchData();
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  const handleSendCampaign = async (campaignId) => {
    try {
      await superAdminService.sendEmailCampaign(campaignId);
      toast.success("Email campaign sent successfully");
      fetchData();
    } catch (error) {
      toast.error("Failed to send campaign");
    }
  };

  const handleSeedEmailData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/super-admin/seed-email-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        toast.success('Sample email campaigns and templates created successfully!');
        fetchData();
      } else {
        toast.error('Failed to seed email data');
      }
    } catch (error) {
      toast.error('Failed to seed email data');
    }
  };

  const handleDeleteItem = async () => {
    try {
      if (modalType === 'campaign') {
        await superAdminService.deleteEmailCampaign(selectedItem.id);
        toast.success("Campaign deleted successfully");
      } else {
        await superAdminService.deleteEmailTemplate(selectedItem.id);
        toast.success("Template deleted successfully");
      }
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      toast.error(`Failed to delete ${modalType}`);
    }
  };

  const resetNewCampaign = () => {
    setNewCampaign({
      name: '',
      subject: '',
      content: '',
      target: 'all',
      scheduledAt: '',
      templateId: ''
    });
  };

  const resetNewTemplate = () => {
    setNewTemplate({
      name: '',
      subject: '',
      content: '',
      category: 'general'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-gray-100 text-gray-800', icon: Edit },
      scheduled: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      sent: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const statCards = [
    {
      title: "Total Campaigns",
      value: loading ? <RefreshCw className="w-5 h-5 animate-spin text-blue-600" /> : stats.totalCampaigns,
      change: loading ? '' : (() => {
        const diff = (typeof stats.totalCampaigns === 'number' && typeof stats.totalCampaignsPrev === 'number') ? (stats.totalCampaigns - stats.totalCampaignsPrev) : 0;
        const sign = diff >= 0 ? '+' : '';
        return `${sign}${diff}`;
      })(),
      changeType: (typeof stats.totalCampaigns === 'number' && typeof stats.totalCampaignsPrev === 'number' && (stats.totalCampaigns - stats.totalCampaignsPrev) >= 0) ? "increase" : "decrease",
      icon: Mail,
      color: (typeof stats.totalCampaigns === 'number' && typeof stats.totalCampaignsPrev === 'number' && (stats.totalCampaigns - stats.totalCampaignsPrev) >= 0) ? "green" : "red"
    },
    {
      title: "Emails Sent",
      value: loading ? <RefreshCw className="w-5 h-5 animate-spin text-green-600" /> : (stats.sentEmails?.toLocaleString() || '0'),
      change: loading ? '' : (() => {
        if (typeof stats.sentEmailsCurrent === 'number' && typeof stats.sentEmailsPrev === 'number') {
          const diff = stats.sentEmailsCurrent - stats.sentEmailsPrev;
          const sign = diff >= 0 ? '+' : '';
          return `${sign}${diff.toLocaleString()}`;
        }
        return '+0';
      })(),
      changeType: (typeof stats.sentEmailsCurrent === 'number' && typeof stats.sentEmailsPrev === 'number' && (stats.sentEmailsCurrent - stats.sentEmailsPrev) >= 0) ? "increase" : "decrease",
      icon: Send,
      color: (typeof stats.sentEmailsCurrent === 'number' && typeof stats.sentEmailsPrev === 'number' && (stats.sentEmailsCurrent - stats.sentEmailsPrev) >= 0) ? "green" : "red"
    },
    {
      title: "Open Rate",
      value: loading ? <RefreshCw className="w-5 h-5 animate-spin text-purple-600" /> : `${stats.openRate}%`,
      change: loading ? '' : (() => {
        const diff = (typeof stats.openRate === 'number' && typeof stats.openRatePrev === 'number') ? (stats.openRate - stats.openRatePrev) : 0;
        const sign = diff >= 0 ? '+' : '';
        return `${sign}${diff}%`;
      })(),
      changeType: (typeof stats.openRate === 'number' && typeof stats.openRatePrev === 'number' && (stats.openRate - stats.openRatePrev) >= 0) ? "increase" : "decrease",
      icon: Eye,
      color: (typeof stats.openRate === 'number' && typeof stats.openRatePrev === 'number' && (stats.openRate - stats.openRatePrev) >= 0) ? "green" : "red"
    },
    {
      title: "Click Rate",
      value: loading ? <RefreshCw className="w-5 h-5 animate-spin text-orange-600" /> : `${stats.clickRate}%`,
      change: loading ? '' : (() => {
        const diff = (typeof stats.clickRate === 'number' && typeof stats.clickRatePrev === 'number') ? (stats.clickRate - stats.clickRatePrev) : 0;
        const sign = diff >= 0 ? '+' : '';
        return `${sign}${diff}%`;
      })(),
      changeType: (typeof stats.clickRate === 'number' && typeof stats.clickRatePrev === 'number' && (stats.clickRate - stats.clickRatePrev) >= 0) ? "increase" : "decrease",
      icon: TrendingUp,
      color: (typeof stats.clickRate === 'number' && typeof stats.clickRatePrev === 'number' && (stats.clickRate - stats.clickRatePrev) >= 0) ? "green" : "red"
    }
  ];

  if (loading && (campaigns.length === 0 && templates.length === 0)) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SuperAdminSidebar />
      <div className="flex-1 lg:ml-80">
          <SuperAdminNavbar />
          <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
            <div className="flex items-center justify-center h-96">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                <span className="text-lg text-gray-600">Loading email management...</span>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
    if (error) {
      return (
        <div className="flex min-h-screen bg-gray-50">
          <SuperAdminSidebar />
          <div className="flex-1 lg:ml-80">
            <SuperAdminNavbar />
            <main className="p-4 lg:p-8 pb-4 pt-32 lg:pt-40 min-h-screen">
              <div className="flex items-center justify-center h-96">
                <div className="flex flex-col items-center space-y-2">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                  <span className="text-lg text-red-600">Failed to load email data.</span>
                  <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Retry
                  </button>
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
              <h1 className="text-3xl font-bold text-gray-900">Email Management</h1>
              <p className="text-gray-600 mt-1">Create and manage email campaigns and templates</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={fetchData}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => {
                  setModalType(activeTab === 'templates' ? 'template' : 'campaign');
                  setShowCreateModal(true);
                }}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create {activeTab === 'templates' ? 'Template' : 'Campaign'}</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    {(() => {
                      const colorTokens = {
                        blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
                        green: { bg: 'bg-green-100', icon: 'text-green-600' },
                        yellow: { bg: 'bg-yellow-100', icon: 'text-yellow-600' },
                        purple: { bg: 'bg-purple-100', icon: 'text-purple-600' },
                        default: { bg: 'bg-gray-100', icon: 'text-gray-600' }
                      };
                      const token = colorTokens[card.color] || colorTokens.default;
                      return (
                        <div className={`p-3 rounded-lg ${token.bg} ${token.icon}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                      );
                    })()}
                    <span className="text-sm font-medium text-green-600">
                      {card.change}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-1">{card.value}</h3>
                    <p className="text-gray-600 text-sm font-medium">{card.title}</p>
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
                  { id: 'campaigns', label: 'Email Campaigns', icon: Mail },
                  { id: 'templates', label: 'Templates', icon: FileText },
                  { id: 'analytics', label: 'Analytics', icon: BarChart3 }
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
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder={`Search ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {activeTab === 'campaigns' && (
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="draft">Draft</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="sent">Sent</option>
                      <option value="failed">Failed</option>
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'campaigns' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Campaign
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status & Target
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {campaigns.map((campaign, index) => (
                        <motion.tr
                          key={campaign.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <Mail className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {campaign.name}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 truncate">
                                  {campaign.subject}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="space-y-2">
                              {getStatusBadge(campaign.status)}
                              <div className="text-xs text-gray-500">
                                Target: {campaign.target}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="flex items-center mb-1">
                                <Users className="w-4 h-4 text-gray-400 mr-2" />
                                <span>{campaign.recipients} recipients</span>
                              </div>
                              {campaign.status === 'sent' && (
                                <>
                                  <div className="text-xs text-gray-500">
                                    Open: {campaign.openRate}% | Click: {campaign.clickRate}%
                                  </div>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div>
                              Created: {new Date(campaign.createdAt).toLocaleDateString()}
                            </div>
                            {campaign.sentAt && (
                              <div>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</div>
                            )}
                            {campaign.scheduledAt && (
                              <div>Scheduled: {new Date(campaign.scheduledAt).toLocaleDateString()}</div>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              {campaign.status === 'draft' && (
                                <button
                                  onClick={() => handleSendCampaign(campaign.id)}
                                  className="text-blue-600 hover:text-blue-900"
                                  title="Send Campaign"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button className="text-gray-600 hover:text-gray-900" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button className="text-gray-600 hover:text-gray-900" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedItem(campaign);
                                  setModalType('campaign');
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'templates' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Template
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Usage
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
                      {templates.map((template, index) => (
                        <motion.tr
                          key={template.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-1">
                                <FileText className="w-5 h-5 text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {template.name}
                                </div>
                                <div className="text-sm text-gray-600 mt-1 truncate">
                                  {template.subject}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {template.category}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {template.usage} times
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(template.updatedAt).toLocaleDateString()}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-gray-600 hover:text-gray-900" title="View">
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              <button className="text-gray-600 hover:text-gray-900" title="Copy">
                                <Copy className="w-4 h-4" />
                              </button>
                              
                              <button className="text-gray-600 hover:text-gray-900" title="Edit">
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  setSelectedItem(template);
                                  setModalType('template');
                                  setShowDeleteModal(true);
                                }}
                                className="text-red-600 hover:text-red-900"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Analytics Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Performance (7 Days)</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="sent" stroke="#3B82F6" strokeWidth={2} name="Sent" />
                          <Line type="monotone" dataKey="opened" stroke="#10B981" strokeWidth={2} name="Opened" />
                          <Line type="monotone" dataKey="clicked" stroke="#F59E0B" strokeWidth={2} name="Clicked" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibent text-gray-900 mb-4">Engagement Rates</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="opened" fill="#10B981" name="Open Rate" />
                          <Bar dataKey="clicked" fill="#F59E0B" name="Click Rate" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
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

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
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
              className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create New {modalType === 'campaign' ? 'Email Campaign' : 'Email Template'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={modalType === 'campaign' ? newCampaign.name : newTemplate.name}
                    onChange={(e) => {
                      if (modalType === 'campaign') {
                        setNewCampaign({ ...newCampaign, name: e.target.value });
                      } else {
                        setNewTemplate({ ...newTemplate, name: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={`${modalType === 'campaign' ? 'Campaign' : 'Template'} name...`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={modalType === 'campaign' ? newCampaign.subject : newTemplate.subject}
                    onChange={(e) => {
                      if (modalType === 'campaign') {
                        setNewCampaign({ ...newCampaign, subject: e.target.value });
                      } else {
                        setNewTemplate({ ...newTemplate, subject: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Email subject..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={modalType === 'campaign' ? newCampaign.content : newTemplate.content}
                    onChange={(e) => {
                      if (modalType === 'campaign') {
                        setNewCampaign({ ...newCampaign, content: e.target.value });
                      } else {
                        setNewTemplate({ ...newTemplate, content: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32 resize-none"
                    placeholder="Email content..."
                  />
                </div>

                {modalType === 'campaign' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                      <select
                        value={newCampaign.target}
                        onChange={(e) => setNewCampaign({ ...newCampaign, target: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Users</option>
                        <option value="users">Regular Users</option>
                        <option value="turf-admins">Turf Admins</option>
                        <option value="new-users">New Users</option>
                        <option value="users-with-bookings">Users with Bookings</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
                      <input
                        type="datetime-local"
                        value={newCampaign.scheduledAt}
                        onChange={(e) => setNewCampaign({ ...newCampaign, scheduledAt: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newTemplate.category}
                      onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">General</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="booking">Booking</option>
                      <option value="security">Security</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={modalType === 'campaign' ? handleCreateCampaign : handleCreateTemplate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create {modalType === 'campaign' ? 'Campaign' : 'Template'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
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
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Delete {modalType === 'campaign' ? 'Campaign' : 'Template'}
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteItem}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SuperAdminEmails;