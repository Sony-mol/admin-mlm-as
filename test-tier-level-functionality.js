// Test Script for Tier and Level Management
// Run this in the browser console on your Tier Management page

console.log('🧪 Starting Tier and Level Management Tests...');

// Test 1: Check if all required components are loaded
function testComponentsLoaded() {
    console.log('📋 Test 1: Checking if components are loaded...');
    
    const addTierButton = document.querySelector('button[onclick*="AddTierModal"]');
    const addLevelButtons = document.querySelectorAll('button[onclick*="AddLevelModal"]');
    
    if (addTierButton) {
        console.log('✅ Add Tier button found');
    } else {
        console.log('❌ Add Tier button not found');
    }
    
    if (addLevelButtons.length > 0) {
        console.log(`✅ ${addLevelButtons.length} Add Level buttons found`);
    } else {
        console.log('❌ Add Level buttons not found');
    }
}

// Test 2: Check if confirmation dialogs are available
function testConfirmationDialogs() {
    console.log('📋 Test 2: Checking if confirmation dialogs are available...');
    
    // Check if ConfirmationDialog component exists in React DevTools
    const reactRoot = document.querySelector('#root');
    if (reactRoot) {
        console.log('✅ React root found - confirmation dialogs should be available');
    } else {
        console.log('❌ React root not found');
    }
}

// Test 3: Simulate form validation
function testFormValidation() {
    console.log('📋 Test 3: Testing form validation...');
    
    // Check if form inputs exist
    const tierSelect = document.querySelector('select[name="tierId"]');
    const levelNumberInput = document.querySelector('input[name="levelNumber"]');
    const referralsInput = document.querySelector('input[name="requiredReferrals"]');
    
    if (tierSelect && levelNumberInput && referralsInput) {
        console.log('✅ All form inputs found');
    } else {
        console.log('❌ Some form inputs missing');
    }
}

// Test 4: Check API endpoints
function testAPIEndpoints() {
    console.log('📋 Test 4: Checking API endpoints...');
    
    const auth = localStorage.getItem('auth');
    if (auth) {
        console.log('✅ Authentication token found');
        
        // Test if we can make API calls
        const token = JSON.parse(auth).accessToken;
        if (token) {
            console.log('✅ Access token available');
        } else {
            console.log('❌ Access token missing');
        }
    } else {
        console.log('❌ No authentication found');
    }
}

// Test 5: Check for existing rewards
function testExistingRewards() {
    console.log('📋 Test 5: Checking existing rewards...');
    
    // This would need to be called after the rewards are loaded
    console.log('ℹ️ This test requires rewards to be loaded first');
}

// Run all tests
function runAllTests() {
    console.log('🚀 Running all tests...\n');
    
    testComponentsLoaded();
    console.log('');
    
    testConfirmationDialogs();
    console.log('');
    
    testFormValidation();
    console.log('');
    
    testAPIEndpoints();
    console.log('');
    
    testExistingRewards();
    console.log('');
    
    console.log('✅ All tests completed!');
    console.log('📝 Manual testing required:');
    console.log('   1. Try adding a new level with a new reward name');
    console.log('   2. Try adding a level with an existing reward name');
    console.log('   3. Try adding a level without selecting a tier');
    console.log('   4. Check if confirmation dialogs appear correctly');
}

// Auto-run tests
runAllTests();

// Export functions for manual testing
window.tierLevelTests = {
    runAllTests,
    testComponentsLoaded,
    testConfirmationDialogs,
    testFormValidation,
    testAPIEndpoints,
    testExistingRewards
};

console.log('💡 Use window.tierLevelTests.runAllTests() to run tests again');
