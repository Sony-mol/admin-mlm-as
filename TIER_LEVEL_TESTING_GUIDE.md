# Tier and Level Management Testing Guide

## 🧪 **Test Scenarios for Add Level Functionality**

### **Test 1: Success Case - New Reward**
1. Go to Tier Management page
2. Click "Add Level" on any tier (e.g., Gold)
3. Fill in the form:
   - **Tier**: Select "GOLD"
   - **Level Number**: 5
   - **Required Referrals**: 100
   - **Reward Name**: "iPhone 15"
   - **Reward Type**: "Gift"
4. Click "Create Level"
5. **Expected Result**: 
   - ✅ Green confirmation dialog: "Level Created Successfully! Level 5 has been added to GOLD tier successfully."
   - Modal closes automatically
   - New level appears in the Gold tier section

### **Test 2: Success Case - Existing Reward**
1. Go to Tier Management page
2. Click "Add Level" on any tier
3. Fill in the form:
   - **Tier**: Select any tier
   - **Level Number**: 6
   - **Required Referrals**: 200
   - **Reward Name**: "2BHK" (existing reward)
   - **Reward Type**: "Gift"
4. Click "Create Level"
5. **Expected Result**:
   - ✅ Green confirmation dialog with success message
   - Uses existing reward instead of creating new one

### **Test 3: Validation Error - Missing Tier**
1. Go to Tier Management page
2. Click "Add Level" on any tier
3. Don't select a tier (leave dropdown as "Select a tier")
4. Fill other fields and click "Create Level"
5. **Expected Result**:
   - ⚠️ Yellow warning dialog: "Please select a tier before creating a level."

### **Test 4: Validation Error - Invalid Level Number**
1. Go to Tier Management page
2. Click "Add Level" on any tier
3. Fill in the form:
   - **Tier**: Select any tier
   - **Level Number**: 0 (invalid)
   - **Required Referrals**: 10
4. Click "Create Level"
5. **Expected Result**:
   - ⚠️ Yellow warning dialog: "Level number must be at least 1."

### **Test 5: Validation Error - Negative Referrals**
1. Go to Tier Management page
2. Click "Add Level" on any tier
3. Fill in the form:
   - **Tier**: Select any tier
   - **Level Number**: 1
   - **Required Referrals**: -5 (invalid)
4. Click "Create Level"
5. **Expected Result**:
   - ⚠️ Yellow warning dialog: "Required referrals must be 0 or greater."

### **Test 6: Duplicate Reward Name (Case Insensitive)**
1. Go to Tier Management page
2. Click "Add Level" on any tier
3. Fill in the form:
   - **Tier**: Select any tier
   - **Level Number**: 7
   - **Required Referrals**: 300
   - **Reward Name**: "cash" (lowercase, but "1.5 Crore" exists which might conflict)
   - **Reward Type**: "Cash"
4. Click "Create Level"
5. **Expected Result**:
   - ❌ Red error dialog: "Failed to Create Reward: Reward with name 'cash' already exists (case-insensitive check)"
   - OR if "cash" doesn't exist: ✅ Success

### **Test 7: Network Error Simulation**
1. Go to Tier Management page
2. Disconnect your internet connection
3. Try to add a level
4. **Expected Result**:
   - ❌ Red error dialog: "Network Error: Network error creating level: Connection timeout..."

## 🧪 **Test Scenarios for Add Tier Functionality**

### **Test 8: Success Case - New Tier**
1. Go to Tier Management page
2. Click "Add Tier" button
3. Fill in the form:
   - **Tier Name**: "PLATINUM"
   - **Description**: "Premium tier for top performers"
4. Click "Create Tier"
5. **Expected Result**:
   - ✅ Green confirmation dialog: "Tier Created Successfully! The 'PLATINUM' tier has been created successfully."

### **Test 9: Validation Error - Empty Tier Name**
1. Go to Tier Management page
2. Click "Add Tier" button
3. Leave tier name empty
4. Click "Create Tier"
5. **Expected Result**:
   - ⚠️ Yellow warning dialog: "Tier name is required. Please enter a tier name."

## 🔍 **Debugging Steps**

### **If Tests Fail:**

1. **Check Browser Console**:
   - Open Developer Tools (F12)
   - Look for any JavaScript errors
   - Check Network tab for failed API calls

2. **Check Railway Logs**:
   - Go to Railway dashboard
   - Check HTTP logs for any 500 errors
   - Look for specific error messages

3. **Check Database**:
   - Verify rewards table has unique constraint
   - Check if duplicate rewards exist

### **Common Issues and Solutions:**

1. **500 Internal Server Error**:
   - Check if backend deployed successfully
   - Verify database constraints are applied
   - Check Railway logs for specific error

2. **Confirmation Dialogs Not Showing**:
   - Check browser console for JavaScript errors
   - Verify ConfirmationDialog component is imported correctly

3. **Reward Creation Still Failing**:
   - Check if database unique constraint was applied
   - Verify case-insensitive duplicate check is working

## 📋 **Test Checklist**

- [ ] Test 1: New reward creation - SUCCESS
- [ ] Test 2: Existing reward usage - SUCCESS  
- [ ] Test 3: Missing tier validation - WARNING
- [ ] Test 4: Invalid level number - WARNING
- [ ] Test 5: Negative referrals - WARNING
- [ ] Test 6: Duplicate reward name - ERROR
- [ ] Test 7: Network error handling - ERROR
- [ ] Test 8: New tier creation - SUCCESS
- [ ] Test 9: Empty tier name - WARNING

## 🎯 **Success Criteria**

All tests should show appropriate confirmation dialogs:
- ✅ **Green dialogs** for successful operations
- ⚠️ **Yellow dialogs** for validation errors
- ❌ **Red dialogs** for system errors

No more 500 Internal Server Errors should occur.
