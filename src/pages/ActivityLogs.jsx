import { useState, useEffect, useCallback, useMemo } from "react";
import { Activity, Search, Filter, Download, Calendar, User, Shield, AlertTriangle, Info, Clock } from "lucide-react";
import { API_ENDPOINTS } from '../config/api';
import ResponsiveTable from '../components/ResponsiveTable';
import EnhancedExportButton from '../components/EnhancedExportButton';
import { ActivityLogActions } from '../components/TableActions';

const ACTIVITY_LOGS_API = API_ENDPOINTS.ACTIVITY_LOGS;
const RECENT_ACTIVITY_API = API_ENDPOINTS.RECENT_ACTIVITIES;
const ACTIVITY_STATS_API = API_ENDPOINTS.ACTIVITY_STATS;

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState({
    logs: true,
    recent: true,
    stats: true
  });
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

  const loadActivityLogs = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(prev => ({ ...prev, logs: true }));
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
      
      if (forceRefresh) {
        params.append("_t", Date.now().toString());
      }

      const finalUrl = `${ACTIVITY_LOGS_API}?${params}`;
      console.log('🔄 Loading Activity Logs from:', finalUrl);
      
      const response = await fetch(finalUrl, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
        cache: forceRefresh ? "no-cache" : "default"
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Activity Logs data received');
        setLogs(data.logs || []);
        setPagination(prev => ({
          ...prev,
          totalPages: data.totalPages || 0,
          totalElements: data.totalElements || 0
        }));
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    } finally {
      setLoading(prev => ({ ...prev, logs: false }));
    }
  }, [pagination.currentPage, pagination.size, searchTerm, filters]);

  // Read initial page/size from URL and keep them in sync
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('page') || '1', 10);
    const s = parseInt(params.get('size') || '20', 10);
    setPagination(prev => ({
      ...prev,
      currentPage: isFinite(p) && p > 0 ? p - 1 : prev.currentPage,
      size: isFinite(s) && s > 0 ? s : prev.size
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(pagination.currentPage + 1));
    params.set('size', String(pagination.size));
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [pagination.currentPage, pagination.size]);

  const loadRecentActivity = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, recent: true }));
      const response = await fetch(RECENT_ACTIVITY_API, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentLogs(data.logs || []);
      } else {
        setRecentLogs([]);
      }
    } catch {
      setRecentLogs([]);
    } finally {
      setLoading(prev => ({ ...prev, recent: false }));
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const response = await fetch(ACTIVITY_STATS_API, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setStats({});
      }
    } catch {
      setStats({});
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // ⚡ PROGRESSIVE LOADING - All 3 API calls run in parallel
  useEffect(() => {
    loadActivityLogs();
    loadRecentActivity();
    loadStats();
  }, [loadActivityLogs, loadRecentActivity, loadStats]);

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 0 }));
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
    if (!dateTime) return { date: "--", time: "--" };
    try {
      // Ensure proper date parsing and IST conversion
      const date = new Date(dateTime);
      
      // Debug logging to help identify timezone issues
      console.log('🔍 Formatting DateTime:', {
        original: dateTime,
        parsed: date.toISOString(),
        ist: date.toLocaleString("en-IN", {timeZone: "Asia/Kolkata"})
      });
      
      return {
        date: date.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" }),
        time: date.toLocaleTimeString("en-IN", { 
          timeZone: "Asia/Kolkata",
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      };
    } catch (error) {
      console.error('❌ Error formatting date/time:', error, 'Input:', dateTime);
      return { date: "--", time: "--" };
    }
  };

  return (
    <div className="p-6 space-y-6 text-[rgb(var(--fg))]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Activity Logs</h1>
          <p className="opacity-70">Monitor system activities and audit trail</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              console.log('🔄 Force refreshing Activity Logs with fresh data...');
              // Force refresh with cache busting
              loadActivityLogs(true);
              loadRecentActivity();
              loadStats();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90"
          >
            <Activity className="w-4 h-4" />
            Refresh
          </button>
          <EnhancedExportButton
            data={logs}
            dataType="activity-logs"
            filename="activity-logs"
            currentFilters={{
              search: searchTerm,
              actionType: filters.actionType,
              category: filters.category,
              severity: filters.severity,
              startDate: filters.startDate,
              endDate: filters.endDate
            }}
            currentSort={null}
            showAdvancedOptions={true}
            defaultFormat="excel"
            isDataPreFiltered={false}
            totalRecords={pagination.totalElements}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-70">Total Logs</p>
              <p className="text-3xl font-bold text-gradient">
                {stats.overview?.totalLogs || pagination.totalElements || logs.length || 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-modern">
              <Activity className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-70">Unique Users</p>
              <p className="text-3xl font-bold text-gradient">
                {stats.overview?.uniqueUsers || new Set(logs.map(log => log.userId).filter(Boolean)).size || 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-modern">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-70">Errors</p>
              <p className="text-3xl font-bold text-gradient">
                {stats.overview?.errorCount || logs.filter(log => log.severity === 'ERROR' || log.severity === 'CRITICAL').length || 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 shadow-modern">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-70">Warnings</p>
              <p className="text-3xl font-bold text-gradient">
                {stats.overview?.warningCount || logs.filter(log => log.severity === 'WARNING').length || 0}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-modern">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="modern-card p-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 opacity-60" />
          <h3 className="text-lg font-semibold">Filters</h3>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm opacity-70">Page size</span>
            <select
              value={pagination.size}
              onChange={(e) => setPagination(prev => ({ ...prev, size: Number(e.target.value), currentPage: 0 }))}
              className="px-2 py-1 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-sm"
            >
              {[10,20,50,100].map(v => (<option key={v} value={v}>{v}</option>))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
            />
          </div>

          {/* Action Type */}
          <select
            value={filters.actionType}
            onChange={(e) => handleFilterChange("actionType", e.target.value)}
            className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
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
            className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
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
            className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
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
            <Calendar className="w-4 h-4 opacity-50" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange("startDate", e.target.value)}
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
            />
            <span className="opacity-60">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange("endDate", e.target.value)}
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.06)] hover:bg-[rgba(var(--fg),0.1)]"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="rounded-xl border border-[rgb(var(--border))] overflow-hidden bg-[rgb(var(--card))]">
        <div className="p-6 border-b border-[rgb(var(--border))]">
          <h3 className="text-lg font-semibold">Activity Logs</h3>
          <p className="text-sm opacity-70">
            Showing {logs.length} of {pagination.totalElements} activities
          </p>
        </div>

        {loading.logs ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 opacity-70">Loading activity logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 opacity-40 mx-auto mb-4" />
            <p className="opacity-70">No activity logs found</p>
          </div>
        ) : (
          <ResponsiveTable
            columns={[
              {
                key: 'actionType',
                title: 'Activity',
                sortable: true,
                render: (value, log) => (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{log.actionType?.replace(/_/g, " ") || "--"}</div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">{log.description || "--"}</div>
                    </div>
                  </div>
                )
              },
              {
                key: 'userId',
                title: 'User/Admin',
                sortable: true,
                render: (value, log) => (
                  <div className="flex items-center gap-3">
                    {log.adminId ? (
                      <>
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium">Admin {log.adminId}</span>
                      </>
                    ) : log.userId ? (
                      <>
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">User {log.userId}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <Activity className="h-4 w-4 text-gray-600" />
                        </div>
                        <span className="text-sm font-medium">System</span>
                      </>
                    )}
                  </div>
                )
              },
              {
                key: 'category',
                title: 'Category',
                sortable: true,
                render: (value, log) => (
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(log.category)}
                    <span className="text-sm">{log.category?.replace(/_/g, " ") || "--"}</span>
                  </div>
                )
              },
              {
                key: 'severity',
                title: 'Severity',
                sortable: true,
                render: (value, log) => (
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(log.severity)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(log.severity)}`}>
                      {log.severity || "INFO"}
                    </span>
                  </div>
                )
              },
              {
                key: 'createdAt',
                title: 'Date & Time',
                sortable: true,
                render: (value, log) => {
                  const dateTime = formatDateTime(log.createdAt);
                  return (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="text-sm">{dateTime.date}</div>
                        <div className="text-xs text-gray-500">{dateTime.time}</div>
                      </div>
                    </div>
                  );
                }
              },
              {
                key: 'ipAddress',
                title: 'IP Address',
                sortable: true,
                render: (value) => (
                  <span className="text-sm opacity-70 font-mono">{value || "--"}</span>
                )
              }
            ]}
            data={logs}
            loading={loading.logs}
            emptyMessage="No activity logs found"
            searchable={false}
            filterable={false}
            selectable={false}
            cardView={true}
            stickyHeader={true}
            actions={(log) => (
              <ActivityLogActions
                log={log}
                onView={(log) => {/* View details */}}
                onExport={(log) => {/* Export log */}}
              />
            )}
            pagination={{
              currentPage: pagination.currentPage + 1,
              totalPages: pagination.totalPages,
              start: pagination.currentPage * pagination.size + 1,
              end: Math.min((pagination.currentPage + 1) * pagination.size, pagination.totalElements),
              total: pagination.totalElements,
              hasPrevious: pagination.currentPage > 0,
              hasNext: pagination.currentPage < pagination.totalPages - 1,
              onPrevious: () => handlePageChange(pagination.currentPage - 1),
              onNext: () => handlePageChange(pagination.currentPage + 1)
            }}
          />
        )}
      </div>
    </div>
  );
}
