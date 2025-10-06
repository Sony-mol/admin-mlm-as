import { useState, useEffect } from "react";
import { Activity, Search, Filter, Download, Calendar, User, Shield, AlertTriangle, Info, Clock } from "lucide-react";
import { API_ENDPOINTS } from '../config/api';

const ACTIVITY_LOGS_API = API_ENDPOINTS.ACTIVITY_LOGS;
const RECENT_ACTIVITY_API = API_ENDPOINTS.RECENT_ACTIVITIES;
const ACTIVITY_STATS_API = API_ENDPOINTS.ACTIVITY_STATS;

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    actionType: "",
    category: "",
    severity: "",
    startDate: "",
    endDate: ""
  });
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });

  const actionTypes = [
    "LOGIN", "LOGOUT", "USER_CREATED", "USER_UPDATED", "USER_SUSPENDED", "USER_ACTIVATED",
    "COMMISSION_APPROVED", "COMMISSION_REJECTED", "COMMISSION_CREATED", "ORDER_CREATED",
    "PAYMENT_PROCESSED", "SETTINGS_UPDATED", "BULK_OPERATION", "SYSTEM_ERROR"
  ];

  const categories = [
    "AUTHENTICATION", "USER_MANAGEMENT", "COMMISSION", "ORDER", "PAYMENT", "SYSTEM", "SETTINGS"
  ];

  const severities = ["INFO", "WARNING", "ERROR", "CRITICAL"];

  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching activity logs...");
      console.log("📊 Current filters:", filters);
      console.log("🔍 Search term:", searchTerm);
      
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        size: pagination.size.toString()
      });

      if (searchTerm) params.append("searchTerm", searchTerm);
      if (filters.actionType) params.append("actionType", filters.actionType);
      if (filters.category) params.append("category", filters.category);
      if (filters.severity) params.append("severity", filters.severity);
      if (filters.startDate) params.append("startDate", filters.startDate + "T00:00:00");
      if (filters.endDate) params.append("endDate", filters.endDate + "T23:59:59");

      const finalUrl = `${ACTIVITY_LOGS_API}?${params}`;
      console.log("🌐 Final API URL:", finalUrl);

      const response = await fetch(finalUrl, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      console.log("📊 Activity logs response:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Activity logs data:", data);
        
        setLogs(data.logs || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0
        }));
      } else {
        console.error("❌ Failed to fetch activity logs:", response.status);
        setLogs([]);
      }
    } catch (error) {
      console.error("❌ Error fetching activity logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentActivity = async () => {
    try {
      console.log("🔍 Fetching recent activity...");
      
      const response = await fetch(RECENT_ACTIVITY_API, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      console.log("📊 Recent activity response:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Recent activity data:", data);
        setRecentLogs(data.logs || []);
      } else {
        console.error("❌ Failed to fetch recent activity:", response.status);
        setRecentLogs([]);
      }
    } catch (error) {
      console.error("❌ Error fetching recent activity:", error);
      setRecentLogs([]);
    }
  };

  const loadStats = async () => {
    try {
      console.log("🔍 Fetching activity statistics...");
      
      const response = await fetch(ACTIVITY_STATS_API, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      console.log("📊 Activity stats response:", response.status, response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Activity stats data:", data);
        setStats(data);
      } else {
        console.error("❌ Failed to fetch activity stats:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("❌ Error details:", errorText);
        setStats({});
      }
    } catch (error) {
      console.error("❌ Error fetching activity stats:", error);
      setStats({});
    }
  };

  useEffect(() => {
    loadActivityLogs();
    loadRecentActivity();
    loadStats();
  }, [pagination.currentPage, searchTerm, filters]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 0 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      actionType: "",
      category: "",
      severity: "",
      startDate: "",
      endDate: ""
    });
    setSearchTerm("");
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "ERROR":
      case "CRITICAL":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "WARNING":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "ERROR":
      case "CRITICAL":
        return "bg-red-100 text-red-800";
      case "WARNING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "AUTHENTICATION":
        return <Shield className="w-4 h-4" />;
      case "USER_MANAGEMENT":
        return <User className="w-4 h-4" />;
      case "COMMISSION":
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return "--";
    try {
      const date = new Date(dateTime);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString()
      };
    } catch (error) {
      return { date: "--", time: "--" };
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Monitor system activities and audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              loadActivityLogs();
              loadRecentActivity();
              loadStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Logs</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overview?.totalLogs || pagination.totalElements || logs.length || 0}
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unique Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.overview?.uniqueUsers || new Set(logs.map(log => log.userId).filter(Boolean)).size || 0}
              </p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {stats.overview?.errorCount || logs.filter(log => log.severity === 'ERROR' || log.severity === 'CRITICAL').length || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.overview?.warningCount || logs.filter(log => log.severity === 'WARNING').length || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Action Type */}
          <select
            value={filters.actionType}
            onChange={(e) => handleFilterChange("actionType", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Action Types</option>
            {actionTypes.map(type => (
              <option key={type} value={type}>{type.replace(/_/g, " ")}</option>
            ))}
          </select>

          {/* Category */}
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category.replace(/_/g, " ")}</option>
            ))}
          </select>

          {/* Severity */}
          <select
            value={filters.severity}
            onChange={(e) => handleFilterChange("severity", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Severities</option>
            {severities.map(severity => (
              <option key={severity} value={severity}>{severity}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Activity Logs</h3>
          <p className="text-sm text-gray-600">
            Showing {logs.length} of {pagination.totalElements} activities
          </p>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity logs found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User/Admin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => {
                    const dateTime = formatDateTime(log.createdAt);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.actionType?.replace(/_/g, " ") || "--"}
                            </p>
                            <p className="text-sm text-gray-600 max-w-xs truncate">
                              {log.description || "--"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {log.adminId ? (
                              <Shield className="w-4 h-4 text-blue-500" />
                            ) : log.userId ? (
                              <User className="w-4 h-4 text-green-500" />
                            ) : (
                              <Activity className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="text-sm text-gray-900">
                              {log.adminId ? `Admin ${log.adminId}` : 
                               log.userId ? `User ${log.userId}` : "System"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getCategoryIcon(log.category)}
                            <span className="text-sm text-gray-900">
                              {log.category?.replace(/_/g, " ") || "--"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getSeverityIcon(log.severity)}
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                              {log.severity || "INFO"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-900">{dateTime.date}</p>
                              <p className="text-xs text-gray-600">{dateTime.time}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 font-mono">
                            {log.ipAddress || "--"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden">
              {logs.map((log) => {
                const dateTime = formatDateTime(log.createdAt);
                return (
                  <div key={log.id} className="p-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(log.severity)}
                        <span className="text-sm font-medium text-gray-900">
                          {log.actionType?.replace(/_/g, " ") || "--"}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                        {log.severity || "INFO"}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {log.description || "--"}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>
                          {log.adminId ? `Admin ${log.adminId}` : 
                           log.userId ? `User ${log.userId}` : "System"}
                        </span>
                        <span>{log.category?.replace(/_/g, " ") || "--"}</span>
                      </div>
                      <span>{dateTime.date} {dateTime.time}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.currentPage + 1} of {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 0}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.totalPages - 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
