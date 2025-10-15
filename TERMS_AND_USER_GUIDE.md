# CQ Wealth Admin Panel - Terms & User Guide

## 📋 Table of Contents
1. [Admin Panel Overview](#admin-panel-overview)
2. [Terms of Use for Administrators](#terms-of-use-for-administrators)
3. [User Guide - Admin Functions](#user-guide---admin-functions)
4. [Security & Access Control](#security--access-control)
5. [Best Practices](#best-practices)

---

## 🎯 Admin Panel Overview

### **What is the Admin Panel?**

The CQ Wealth Admin Panel (asmlm) is a **web-based dashboard** for administrators to:
- Manage users and their accounts
- Monitor MLM network activities
- Process withdrawal requests
- View system statistics
- Manage tiers, levels, and rewards
- Oversee commission structures

### **Technology Stack:**
- **Frontend:** React + Vite
- **Styling:** Tailwind CSS
- **Deployment:** Railway
- **API:** Connects to Spring Boot backend

---

## ⚖️ Terms of Use for Administrators

### **1. Administrator Responsibilities**

**As an administrator, you agree to:**

✅ **Maintain Confidentiality**
- Keep login credentials secure
- Never share admin access with unauthorized persons
- Use strong passwords (minimum 12 characters)
- Enable two-factor authentication when available

✅ **Act with Integrity**
- Make fair and unbiased decisions
- Process withdrawal requests promptly (24-48 hours)
- Investigate disputes thoroughly
- Maintain accurate records

✅ **Protect User Data**
- Access user data only when necessary
- Never misuse personal information
- Follow data protection regulations
- Report security breaches immediately

✅ **Follow Company Policies**
- Adhere to MLM regulations
- Comply with financial guidelines
- Maintain professional conduct
- Report suspicious activities

---

### **2. Access Control**

**Administrator Access Levels:**

| Level | Permissions | Responsibilities |
|-------|-------------|------------------|
| **Super Admin** | Full system access | System configuration, user management, all approvals |
| **Admin** | User & transaction management | Process withdrawals, manage users, view reports |
| **Moderator** | View-only + limited actions | Monitor activities, basic support |

**Access Rules:**
- ❌ Never access the system from public computers
- ❌ Never leave admin panel open unattended
- ✅ Always log out after session
- ✅ Use secure, private networks only

---

### **3. Data Handling**

**What Data You Can Access:**
- User profiles (name, email, phone, bank details)
- Transaction history
- Commission records
- Referral networks
- Earnings and withdrawals

**What You CANNOT Do:**
- ❌ Share user data externally
- ❌ Use data for personal gain
- ❌ Modify records without authorization
- ❌ Delete user accounts without proper cause

**What You MUST Do:**
- ✅ Verify user identity before sensitive actions
- ✅ Document all administrative actions
- ✅ Report data breaches within 24 hours
- ✅ Follow audit procedures

---

### **4. Withdrawal Processing**

**Standard Operating Procedure:**

**Step 1: Review Request**
- Check user eligibility (minimum balance)
- Verify bank account details
- Check for any flags or restrictions

**Step 2: Validation**
- Confirm available balance
- Verify no pending disputes
- Check transaction history

**Step 3: Approval/Rejection**
- Approve if all checks pass
- Reject with clear reason if issues found
- Process within 24-48 hours

**Step 4: Documentation**
- Record approval/rejection reason
- Update transaction status
- Notify user via email/SMS

**Grounds for Rejection:**
- Insufficient balance
- Incorrect bank details
- Suspicious activity
- Account under investigation
- Violation of terms

---

### **5. User Management**

**Actions You Can Take:**

✅ **View User Details**
- Profile information
- Referral network
- Earnings history
- Transaction records

✅ **Modify User Status**
- Activate/deactivate accounts
- Suspend for investigation
- Reset passwords (with verification)
- Update tier/level (with justification)

✅ **Handle Disputes**
- Review complaints
- Investigate issues
- Make fair decisions
- Document resolutions

❌ **Actions Prohibited:**
- Arbitrarily suspending accounts
- Modifying earnings without cause
- Favoritism or discrimination
- Deleting transaction records

---

### **6. Commission & Tier Management**

**What You Can Configure:**

✅ **Tier Settings**
- Commission percentages (Bronze: 10%, Silver: 15%, Gold: 20%)
- Level requirements
- Upgrade criteria

✅ **Level Management**
- Create new levels
- Set referral requirements
- Assign rewards
- Configure commission structure

✅ **Reward System**
- Define reward values
- Set eligibility criteria
- Approve reward claims
- Track reward distribution

**Important Rules:**
- 📝 Document all changes
- 📢 Notify users of structure changes (30 days notice)
- 💾 Backup before major changes
- 🔍 Test changes in staging first

---

### **7. Reporting & Analytics**

**Reports You Can Generate:**

📊 **User Statistics**
- Total users, active users
- New registrations (daily/monthly)
- User distribution by tier
- Geographic distribution

📊 **Financial Reports**
- Total commissions paid
- Pending withdrawals
- Monthly earnings trends
- Revenue by tier

📊 **Network Analytics**
- Referral network depth
- Top performers
- Inactive users
- Growth trends

📊 **Compliance Reports**
- Tax documentation (TDS)
- Audit trails
- Transaction logs
- User verification status

---

### **8. Security Measures**

**Your Responsibilities:**

🔒 **Password Security**
- Use strong, unique passwords
- Change password every 90 days
- Never reuse old passwords
- Use password manager

🔒 **Session Management**
- Log out after each session
- Set session timeout (15 minutes)
- Clear browser cache regularly
- Use incognito mode if needed

🔒 **Access Monitoring**
- Review login history regularly
- Report suspicious access
- Monitor failed login attempts
- Check active sessions

🔒 **Data Protection**
- Encrypt sensitive data
- Use HTTPS always
- Secure file downloads
- Shred printed documents

---

## 📖 User Guide - Admin Functions

### **1. Dashboard Overview**

**Main Dashboard Sections:**

```
┌─────────────────────────────────────────────┐
│  📊 STATISTICS OVERVIEW                     │
│  - Total Users                              │
│  - Active Members                           │
│  - Pending Withdrawals                      │
│  - Today's Earnings                         │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  👥 USER MANAGEMENT                         │
│  - View All Users                           │
│  - Search Users                             │
│  - Filter by Status/Tier                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💰 WITHDRAWAL REQUESTS                     │
│  - Pending Approvals                        │
│  - Approved Withdrawals                     │
│  - Rejected Requests                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ⚙️ SYSTEM CONFIGURATION                    │
│  - Tier Management                          │
│  - Level Settings                           │
│  - Reward Configuration                     │
└─────────────────────────────────────────────┘
```

---

### **2. User Management Guide**

#### **Viewing User Details**

**Step 1:** Navigate to "Users" section
**Step 2:** Search by name, email, or user ID
**Step 3:** Click on user to view full profile

**User Profile Shows:**
- Personal information
- Contact details
- Referral code
- Current tier and level
- Referral network (tree view)
- Earnings summary
- Transaction history
- Account status

#### **Managing User Status**

**To Activate/Deactivate User:**
1. Go to user profile
2. Click "Status" dropdown
3. Select "Active" or "Inactive"
4. Enter reason for change
5. Click "Update Status"
6. System sends notification to user

**To Suspend User:**
1. Go to user profile
2. Click "Suspend Account"
3. Select suspension reason:
   - Suspicious activity
   - Terms violation
   - Under investigation
   - Payment dispute
4. Set suspension duration
5. Add admin notes
6. Confirm suspension

**To Reset User Password:**
1. Go to user profile
2. Click "Reset Password"
3. Verify user identity (phone/email)
4. Generate temporary password
5. Send to user via secure channel
6. User must change on first login

---

### **3. Withdrawal Processing Guide**

#### **Viewing Withdrawal Requests**

**Dashboard View:**
```
┌──────────────────────────────────────────────────────┐
│  PENDING WITHDRAWALS (12)                            │
├──────────────────────────────────────────────────────┤
│  User: John Doe                                      │
│  Amount: ₹5,000                                      │
│  Requested: 2024-01-15 10:30 AM                      │
│  Bank: HDFC Bank - XXXX1234                          │
│  [View Details] [Approve] [Reject]                   │
├──────────────────────────────────────────────────────┤
│  User: Jane Smith                                    │
│  Amount: ₹2,500                                      │
│  Requested: 2024-01-15 09:15 AM                      │
│  UPI: john@paytm                                     │
│  [View Details] [Approve] [Reject]                   │
└──────────────────────────────────────────────────────┘
```

#### **Approval Process**

**Step 1: Review Request**
- Click "View Details"
- Check user's available balance
- Verify bank account details
- Review transaction history
- Check for any red flags

**Step 2: Validate Information**
- Confirm minimum balance met (₹100)
- Verify no pending disputes
- Check account is active
- Ensure no duplicate requests

**Step 3: Make Decision**

**To Approve:**
1. Click "Approve" button
2. Review final details
3. Enter admin password for confirmation
4. Add approval notes (optional)
5. Click "Confirm Approval"
6. System processes payment
7. User receives confirmation email

**To Reject:**
1. Click "Reject" button
2. Select rejection reason:
   - Insufficient balance
   - Incorrect bank details
   - Account under review
   - Duplicate request
   - Other (specify)
3. Add detailed explanation
4. Click "Confirm Rejection"
5. User receives notification with reason

**Step 4: Follow-up**
- Monitor payment status
- Update if payment fails
- Handle user queries
- Document resolution

---

### **4. Tier & Level Management**

#### **Viewing Tier Structure**

**Current Structure:**
```
BRONZE TIER (10% Commission)
├─ Level 1: 0 referrals
├─ Level 2: 5 referrals
├─ Level 3: 10 referrals
├─ Level 4: 15 referrals
└─ Level 5: 20 referrals

SILVER TIER (15% Commission)
├─ Level 1: 25 referrals
├─ Level 2: 30 referrals
├─ Level 3: 40 referrals
├─ Level 4: 50 referrals
└─ Level 5: 60 referrals

GOLD TIER (20% Commission)
├─ Level 1: 75 referrals
├─ Level 2: 100 referrals
├─ Level 3: 150 referrals
├─ Level 4: 200 referrals
└─ Level 5: 250 referrals
```

#### **Modifying Tier Settings**

**To Update Commission Rates:**
1. Go to "Tier Management"
2. Select tier (Bronze/Silver/Gold)
3. Click "Edit Commission"
4. Enter new percentage
5. Set effective date (30 days notice)
6. Add change reason
7. Save changes
8. System notifies all users

**To Add New Level:**
1. Go to "Level Management"
2. Select tier
3. Click "Add Level"
4. Set level number
5. Define referral requirement
6. Assign reward
7. Configure commission structure
8. Save level

---

### **5. Reward Management**

#### **Creating Rewards**

**Step 1: Define Reward**
- Go to "Rewards" section
- Click "Create New Reward"
- Enter reward details:
  - Name (e.g., "Welcome Bonus")
  - Type (Cash/Gift/Points)
  - Value (₹1,000)
  - Description

**Step 2: Set Eligibility**
- Minimum referrals required
- Tier requirement
- Time period
- One-time or recurring

**Step 3: Activate**
- Review details
- Set start date
- Activate reward
- System makes available to users

#### **Approving Reward Claims**

**When User Claims Reward:**
1. Review claim request
2. Verify eligibility:
   - Check referral count
   - Confirm paid referrals only
   - Verify tier/level
3. Approve or reject
4. If approved, credit to wallet
5. Update reward status

---

### **6. Reports & Analytics**

#### **Generating Reports**

**User Report:**
1. Go to "Reports" → "Users"
2. Select date range
3. Choose filters:
   - Tier
   - Status
   - Registration date
4. Click "Generate Report"
5. View online or download CSV/PDF

**Financial Report:**
1. Go to "Reports" → "Financials"
2. Select report type:
   - Commission paid
   - Withdrawals processed
   - Pending amounts
   - Revenue by tier
3. Set date range
4. Generate report
5. Export for accounting

**Network Report:**
1. Go to "Reports" → "Network"
2. View:
   - Total referrals
   - Network depth
   - Active vs inactive
   - Growth trends
3. Visualize with charts
4. Export data

---

### **7. System Configuration**

#### **General Settings**

**Commission Configuration:**
- Set commission percentages
- Define payout schedule
- Configure minimum withdrawal
- Set maximum withdrawal limits

**Email Templates:**
- Welcome email
- OTP verification
- Withdrawal confirmation
- Rejection notification
- Password reset

**Notification Settings:**
- SMS alerts
- Email notifications
- In-app notifications
- Admin alerts

#### **Security Settings**

**Access Control:**
- Manage admin users
- Set permissions
- Configure roles
- Review access logs

**Session Management:**
- Set timeout duration
- Configure max sessions
- Enable/disable remember me
- Force logout options

---

## 🔒 Security & Access Control

### **Login Security**

**Best Practices:**
- ✅ Use strong passwords (12+ characters)
- ✅ Enable two-factor authentication
- ✅ Change password every 90 days
- ✅ Use unique password (not reused)
- ✅ Log out after each session

**Red Flags to Watch:**
- 🚨 Multiple failed login attempts
- 🚨 Login from unusual location
- 🚨 Login at odd hours
- 🚨 Multiple concurrent sessions

---

### **Data Protection**

**Handling Sensitive Data:**

| Data Type | Protection Level | Access |
|-----------|-----------------|--------|
| User passwords | Encrypted (bcrypt) | Never visible |
| Bank details | Encrypted at rest | Admin only |
| Transaction data | Audit logged | Admin + user |
| Personal info | SSL encrypted | Admin + user |

**Compliance:**
- ✅ GDPR principles (if applicable)
- ✅ Indian IT Act, 2000
- ✅ Data Protection Bill guidelines
- ✅ Financial regulations

---

## ✅ Best Practices

### **Daily Tasks**

**Morning Routine:**
1. Check pending withdrawal requests
2. Review overnight registrations
3. Monitor system alerts
4. Check for support tickets

**Throughout Day:**
1. Process withdrawals promptly
2. Respond to user queries
3. Monitor suspicious activities
4. Update user statuses as needed

**End of Day:**
1. Review day's transactions
2. Generate daily report
3. Check for pending tasks
4. Log out securely

---

### **Weekly Tasks**

**Every Week:**
1. Review user growth trends
2. Analyze withdrawal patterns
3. Check tier distribution
4. Review commission payouts
5. Update documentation
6. Backup important data

---

### **Monthly Tasks**

**Every Month:**
1. Generate monthly reports
2. Review tier/level settings
3. Analyze network growth
4. Plan system improvements
5. Conduct security audit
6. Review admin access logs

---

## 📞 Support & Escalation

### **Getting Help**

**Technical Issues:**
- Email: tech@cqwealth.com
- Phone: +91 1800-123-4567 (Ext. 2)
- Support Hours: 9 AM - 6 PM IST

**Policy Questions:**
- Email: admin@cqwealth.com
- Phone: +91 1800-123-4567 (Ext. 1)

**Emergency Escalation:**
- Security breach: Immediate notification to CTO
- System outage: Contact DevOps team
- Legal issues: Contact legal department

---

## 📝 Audit & Compliance

### **Audit Trail**

**All Actions Logged:**
- User status changes
- Withdrawal approvals/rejections
- Tier/level modifications
- Reward distributions
- System configuration changes

**Log Retention:**
- Transaction logs: 7 years
- Access logs: 1 year
- Audit trails: 5 years
- User data: Until account deletion + 1 year

---

## 🎓 Training & Certification

### **Required Training:**

**New Admin Onboarding:**
1. System overview (2 hours)
2. User management (3 hours)
3. Withdrawal processing (2 hours)
4. Security protocols (1 hour)
5. Compliance training (2 hours)

**Ongoing Training:**
- Quarterly security updates
- Annual compliance review
- New feature training
- Best practices workshops

---

**Last Updated:** January 2025

**Document Version:** 1.0

**For Admin Use Only - Confidential**

