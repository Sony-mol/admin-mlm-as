import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout';
import Overview from './pages/Overview';
import Analytics from './pages/Analytics';
import Products from './pages/Products';
import Users from './pages/Users';
import ReferralTree from './pages/ReferralTree';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Commissions from './pages/Commissions';
import Withdrawals from './pages/Withdrawals';
import ActivityLogs from './pages/ActivityLogs';
import AdminManagement from './pages/AdminManagement';
import TierManagement from './pages/TierManagement';
import Rewards from './pages/Rewards';
import UserRewards from './pages/UserRewards';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Login from './pages/Login';
import TermsManagement from './pages/TermsManagement';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<Overview />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="products" element={<Products />} />
        <Route path="users" element={<Users />} />
        <Route path="referral" element={<ReferralTree />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payments" element={<Payments />} />
        <Route path="commissions" element={<Commissions />} />
        <Route path="withdrawals" element={<Withdrawals />} />
        <Route path="activity-logs" element={<ActivityLogs />} />
        <Route path="tier-management" element={<TierManagement />} />
            <Route path="rewards" element={<Rewards />} />
            <Route path="user-rewards" element={<UserRewards />} />
        <Route path="admin-management" element={<AdminManagement />} />
        <Route path="terms-management" element={<TermsManagement />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}
