import { API_ENDPOINTS } from '../config/api';

class AnalyticsService {
  constructor(authFetch) {
    this.authFetch = authFetch;
  }

  // User Growth Analytics
  async getUserGrowthData(timeRange = '30d') {
    try {
      console.log('🔍 AnalyticsService: Fetching user growth data for range:', timeRange);
      
      // Use same auth approach as Overview page
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).accessToken
        : "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      console.log('🔍 AnalyticsService: Making request to:', API_ENDPOINTS.USERS);
      console.log('🔍 AnalyticsService: Headers:', headers);
      
      const response = await fetch(API_ENDPOINTS.USERS, {
        cache: "no-store",
        headers,
      });
      
      console.log('🔍 AnalyticsService: Response status:', response.status);
      
      if (response.ok) {
        const users = await response.json();
        console.log('✅ AnalyticsService: Users data received:', {
          totalUsers: users.length,
          sampleUser: users[0]
        });
        return this.transformUsersToGrowthData(users, timeRange);
      }
      throw new Error(`Failed to fetch user growth data: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.error('❌ AnalyticsService: Error fetching user growth data:', error);
      console.log('🔄 AnalyticsService: Falling back to mock data...');
      return this.getMockUserGrowthData(timeRange);
    }
  }

  // Commission Analytics
  async getCommissionAnalytics(timeRange = '30d') {
    try {
      // Use same auth approach as Overview page
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).accessToken
        : "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Use existing commission endpoints and combine data
      const [pendingResponse, paidResponse] = await Promise.all([
        fetch(API_ENDPOINTS.PENDING_COMMISSIONS, { cache: "no-store", headers }),
        fetch(API_ENDPOINTS.PAID_COMMISSIONS, { cache: "no-store", headers })
      ]);
      
      if (pendingResponse.ok && paidResponse.ok) {
        const pendingData = await pendingResponse.json();
        const paidData = await paidResponse.json();
        return this.transformCommissionsToAnalytics(pendingData, paidData, timeRange);
      }
      throw new Error('Failed to fetch commission analytics');
    } catch (error) {
      console.error('Error fetching commission analytics:', error);
      return this.getMockCommissionData(timeRange);
    }
  }

  // Revenue Analytics
  async getRevenueData(timeRange = '30d') {
    try {
      // Use same auth approach as Overview page
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).accessToken
        : "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      const response = await fetch(API_ENDPOINTS.PAYMENTS, {
        cache: "no-store",
        headers,
      });
      
      if (response.ok) {
        const payments = await response.json();
        return this.transformPaymentsToRevenueData(payments, timeRange);
      }
      throw new Error('Failed to fetch revenue data');
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      return this.getMockRevenueData(timeRange);
    }
  }

  // Performance Metrics
  async getPerformanceMetrics() {
    try {
      // Use same auth approach as Overview page
      const token = localStorage.getItem("auth")
        ? JSON.parse(localStorage.getItem("auth")).accessToken
        : "";
      const headers = token ? { Authorization: `Bearer ${token}` } : "";
      
      const response = await fetch(API_ENDPOINTS.COMMISSION_DASHBOARD, {
        cache: "no-store",
        headers,
      });
      
      if (response.ok) {
        const dashboardData = await response.json();
        return this.transformDashboardToMetrics(dashboardData);
      }
      throw new Error('Failed to fetch performance metrics');
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      return this.getMockPerformanceMetrics();
    }
  }

  // Top Performers
  async getTopPerformers() {
    try {
      const response = await this.authFetch(API_ENDPOINTS.TOP_PERFORMERS);
      if (response.ok) {
        const data = await response.json();
        let performers = Array.isArray(data) ? data : data.topPerformers || data.data || [];
        
        // Transform the data to ensure it has the required fields
        return performers.map(performer => ({
          name: performer.name || performer.fullName || performer.username || 'Unknown User',
          referrals: performer.referrals || performer.totalReferrals || performer.referralCount || 0,
          earnings: performer.earnings || performer.totalEarnings || performer.earnings || 0,
          tier: performer.tier || performer.userTier || performer.level || 'BRONZE'
        }));
      }
      throw new Error('Failed to fetch top performers');
    } catch (error) {
      console.error('Error fetching top performers:', error);
      return this.getMockTopPerformers();
    }
  }

  // Recent Activities
  async getRecentActivities() {
    try {
      const response = await this.authFetch(API_ENDPOINTS.RECENT_ACTIVITIES);
      if (response.ok) {
        const data = await response.json();
        let activities = Array.isArray(data) ? data : data.activities || data.data || [];
        
        // Transform the data to ensure it has the required fields
        return activities.map(activity => ({
          type: activity.type || activity.action || 'general',
          message: activity.message || activity.description || activity.action || 'Activity recorded',
          time: activity.time || activity.timestamp || activity.createdAt || 'Just now',
          icon: activity.icon || null
        }));
      }
      throw new Error('Failed to fetch recent activities');
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return this.getMockRecentActivities();
    }
  }

  // Tier Statistics
  async getTierStatistics() {
    try {
      const response = await this.authFetch(API_ENDPOINTS.TIER_STATISTICS);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch tier statistics');
    } catch (error) {
      console.error('Error fetching tier statistics:', error);
      return this.getMockTierStatistics();
    }
  }

  // Monthly Revenue
  async getMonthlyRevenue() {
    try {
      const response = await this.authFetch(API_ENDPOINTS.MONTHLY_REVENUE);
      if (response.ok) {
        return await response.json();
      }
      throw new Error('Failed to fetch monthly revenue');
    } catch (error) {
      console.error('Error fetching monthly revenue:', error);
      return this.getMockMonthlyRevenue();
    }
  }

  // Data transformation methods
  transformUsersToGrowthData(users, timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    // Ensure we have an array
    const usersList = Array.isArray(users) ? users : [];
    
    console.log('🔍 AnalyticsService: User Growth Data Debug:', {
      totalUsers: usersList.length,
      userSample: usersList[0],
      timeRange,
      days
    });
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter users created on this date
      const newUsers = usersList.filter(user => {
        const userDate = new Date(user.createdAt || user.created_at || user.joinDate || user.registeredAt || user.createdDate).toISOString().split('T')[0];
        return userDate === dateStr;
      }).length;
      
      // Calculate cumulative users up to this date
      const totalUsersUpToDate = usersList.filter(user => {
        const userDate = new Date(user.createdAt || user.created_at || user.joinDate || user.registeredAt || user.createdDate);
        return userDate <= new Date(dateStr + 'T23:59:59');
      }).length;
      
      // Calculate active users up to this date
      const activeUsersUpToDate = usersList.filter(user => {
        const userDate = new Date(user.createdAt || user.created_at || user.joinDate || user.registeredAt || user.createdDate);
        return userDate <= new Date(dateStr + 'T23:59:59') && (user.status === 'ACTIVE' || user.status === 'active');
      }).length;
      
      data.push({
        date: dateStr,
        newUsers,
        totalUsers: totalUsersUpToDate,
        activeUsers: activeUsersUpToDate
      });
    }
    
    console.log('📊 AnalyticsService: User Growth Result:', {
      dataLength: data.length,
      sampleData: data.slice(0, 3),
      lastDataPoint: data[data.length - 1]
    });
    
    return { data };
  }

  transformCommissionsToAnalytics(pendingData, paidData, timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const barData = [];
    
    // Ensure we have arrays
    const pendingCommissions = Array.isArray(pendingData) ? pendingData : [];
    const paidCommissions = Array.isArray(paidData) ? paidData : [];
    
    console.log('🔍 Commission Data Debug:', {
      pendingCount: pendingCommissions.length,
      paidCount: paidCommissions.length,
      pendingSample: pendingCommissions[0],
      paidSample: paidCommissions[0]
    });
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Calculate pending commissions for this date
      const pending = pendingCommissions.filter(commission => {
        const commissionDate = new Date(commission.createdAt || commission.created_at || commission.timestamp || commission.dateCreated).toISOString().split('T')[0];
        return commissionDate === dateStr;
      }).reduce((sum, comm) => {
        const amount = parseFloat(comm.amount || comm.commissionAmount || comm.value || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      // Calculate paid commissions for this date
      const paid = paidCommissions.filter(commission => {
        const commissionDate = new Date(commission.updatedAt || commission.paidAt || commission.createdAt || commission.created_at || commission.timestamp).toISOString().split('T')[0];
        return commissionDate === dateStr;
      }).reduce((sum, comm) => {
        const amount = parseFloat(comm.amount || comm.commissionAmount || comm.value || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      barData.push({
        date: dateStr,
        pending,
        paid,
        total: pending + paid
      });
    }
    
    // Calculate pie data with actual amounts
    const totalPendingAmount = pendingCommissions.reduce((sum, comm) => {
      const amount = parseFloat(comm.amount || comm.commissionAmount || comm.value || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const totalPaidAmount = paidCommissions.reduce((sum, comm) => {
      const amount = parseFloat(comm.amount || comm.commissionAmount || comm.value || 0);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);
    
    const pieData = [
      { name: 'Paid Commissions', value: totalPaidAmount, color: '#10B981' },
      { name: 'Pending Commissions', value: totalPendingAmount, color: '#F59E0B' }
    ];
    
    console.log('📊 Commission Analytics Result:', {
      barDataLength: barData.length,
      totalPendingAmount,
      totalPaidAmount,
      sampleBarData: barData.slice(0, 3)
    });
    
    return { barData, pieData };
  }

  transformPaymentsToRevenueData(payments, timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    // Ensure we have an array
    const paymentsList = Array.isArray(payments) ? payments : [];
    
    console.log('🔍 Revenue Data Debug:', {
      totalPayments: paymentsList.length,
      paymentSample: paymentsList[0]
    });
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayPayments = paymentsList.filter(payment => {
        const paymentDate = new Date(payment.createdAt || payment.created_at || payment.date || payment.paymentDate || payment.timestamp).toISOString().split('T')[0];
        return paymentDate === dateStr;
      });
      
      const revenue = dayPayments.reduce((sum, payment) => {
        const amount = parseFloat(payment.amount || payment.totalAmount || payment.value || 0);
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
      
      const expenses = dayPayments.reduce((sum, payment) => {
        const fees = parseFloat(payment.fees || payment.fee || payment.commission || 0);
        return sum + (isNaN(fees) ? 0 : fees);
      }, 0);
      
      const profit = revenue - expenses;
      
      data.push({
        date: dateStr,
        revenue,
        expenses,
        profit,
        cumulative: (i === days - 1 ? 0 : data[data.length - 1]?.cumulative || 0) + profit
      });
    }
    
    console.log('📊 Revenue Result:', {
      dataLength: data.length,
      sampleData: data.slice(0, 3)
    });
    
    return { data };
  }

  transformDashboardToMetrics(dashboardData) {
    // Handle different dashboard data structures
    const stats = dashboardData.stats || dashboardData;
    
    return {
      totalUsers: stats.totalUsers || stats.total_users || 0,
      activeUsers: stats.activeUsers || stats.active_users || 0,
      newUsersToday: stats.newUsersToday || stats.new_users_today || 0,
      conversionRate: stats.conversionRate || stats.conversion_rate || 0,
      avgCommissionPerUser: stats.avgCommissionPerUser || stats.avg_commission_per_user || 0,
      totalCommissions: stats.totalCommissions || stats.total_commissions || 0,
      pendingCommissions: stats.pendingCommissions || stats.pending_commissions || 0,
      paidCommissions: stats.paidCommissions || stats.paid_commissions || 0
    };
  }

  // Mock data generators (fallbacks)
  getMockUserGrowthData(timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        newUsers: Math.floor(Math.random() * 50) + 10,
        totalUsers: Math.floor(Math.random() * 100) + 200 + (days - i) * 5,
        activeUsers: Math.floor(Math.random() * 80) + 150 + (days - i) * 3
      });
    }
    
    return { data };
  }

  getMockCommissionData(timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const barData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      barData.push({
        date: date.toISOString().split('T')[0],
        pending: Math.floor(Math.random() * 50000) + 10000,
        paid: Math.floor(Math.random() * 80000) + 20000,
        total: Math.floor(Math.random() * 130000) + 30000
      });
    }
    
    const pieData = [
      { name: 'Direct Commission', value: Math.floor(Math.random() * 100000) + 50000, color: '#3B82F6' },
      { name: 'Binary Commission', value: Math.floor(Math.random() * 80000) + 30000, color: '#10B981' },
      { name: 'Matching Bonus', value: Math.floor(Math.random() * 60000) + 20000, color: '#F59E0B' },
      { name: 'Leadership Bonus', value: Math.floor(Math.random() * 40000) + 10000, color: '#EF4444' }
    ];
    
    return { barData, pieData };
  }

  getMockRevenueData(timeRange) {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 200000) + 50000,
        expenses: Math.floor(Math.random() * 80000) + 20000,
        profit: Math.floor(Math.random() * 120000) + 30000,
        cumulative: (i === days - 1 ? 0 : data[data.length - 1]?.cumulative || 0) + Math.floor(Math.random() * 120000) + 30000
      });
    }
    
    return { data };
  }

  getMockPerformanceMetrics() {
    return {
      totalUsers: 1247,
      activeUsers: 892,
      newUsersToday: 23,
      conversionRate: 68.5,
      avgCommissionPerUser: 15420,
      totalCommissions: 19234000,
      pendingCommissions: 2340000,
      paidCommissions: 16894000
    };
  }

  getMockTopPerformers() {
    return [
      { name: 'Charan Kumar', referrals: 45, earnings: 125000, tier: 'GOLD' },
      { name: 'Gouhar Khan', referrals: 38, earnings: 98000, tier: 'GOLD' },
      { name: 'Sony Kumar', referrals: 32, earnings: 87000, tier: 'SILVER' },
      { name: 'Rajesh Singh', referrals: 28, earnings: 76000, tier: 'SILVER' },
      { name: 'Priya Sharma', referrals: 25, earnings: 68000, tier: 'BRONZE' }
    ];
  }

  getMockRecentActivities() {
    return [
      { type: 'user_registration', message: 'New user registered: John Doe', time: '2 minutes ago' },
      { type: 'commission_paid', message: 'Commission paid to Charan Kumar: ₹12,500', time: '5 minutes ago' },
      { type: 'tier_upgrade', message: 'Gouhar Khan upgraded to GOLD tier', time: '12 minutes ago' },
      { type: 'high_earning', message: 'Sony Kumar reached ₹1,00,000 total earnings', time: '18 minutes ago' },
      { type: 'referral_milestone', message: 'Rajesh Singh achieved 25 referrals', time: '25 minutes ago' }
    ];
  }

  getMockTierStatistics() {
    return {
      gold: { count: 45, percentage: 15.2 },
      silver: { count: 128, percentage: 43.2 },
      bronze: { count: 124, percentage: 41.6 }
    };
  }

  getMockMonthlyRevenue() {
    return {
      currentMonth: 1250000,
      lastMonth: 980000,
      growth: 27.6
    };
  }
}

export default AnalyticsService;
