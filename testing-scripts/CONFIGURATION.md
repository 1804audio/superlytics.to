# 🔧 SuperLytics Testing Configuration

## 🎯 Centralized Configuration System

All SuperLytics API tests now use a centralized configuration system that makes it easy to manage API keys, website IDs, and base URLs across all test files.

### 📁 Configuration File

**Location**: `testing-scripts/api-tests/config.js`

```javascript
// Main API Key for testing (update this to change across all tests)
const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';

// Test Website ID (update if needed)
const WEBSITE_ID = '77b5aae8-8e1c-4604-a4cc-a4de2b9e3b7e';

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

module.exports = {
  API_KEY,
  WEBSITE_ID,
  BASE_URL,
  CONFIG
};
```

### 🔄 How Test Files Use Configuration

**Before (Hardcoded):**
```javascript
const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const WEBSITE_ID = '77b5aae8-8e1c-4604-a4cc-a4de2b9e3b7e';
const BASE_URL = 'http://localhost:3000';

// Later in code...
fetch('http://localhost:3000/api/websites', {
  headers: { 'x-api-key': API_KEY }
});
```

**After (Centralized):**
```javascript
const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

// Later in code...
fetch(`${BASE_URL}/api/websites`, {
  headers: { 'x-api-key': API_KEY }
});
```

## 🚀 Quick API Key Update

### Method 1: Manual Update (Recommended)

1. Edit `testing-scripts/api-tests/config.js`
2. Update the `API_KEY` constant:
   ```javascript
   const API_KEY = 'sly_your_new_api_key_here';
   ```
3. All test files automatically use the new key!

### Method 2: Using Update Utility

```bash
cd testing-scripts/api-tests
node update-api-key.js sly_your_new_api_key_here
```

**Example:**
```bash
node update-api-key.js sly_new12345abcdef67890
```

**Output:**
```
✅ API Key Updated Successfully!
   Old key: sly_bb5f9889...
   New key: sly_new12345...

🎯 All test files will now use the new API key automatically!
   No need to update individual test files.

📊 Test files that will use the new key:
   • Authentication tests (6 endpoints)
   • User management tests (7 endpoints)
   • API key management tests (3 endpoints)
   • Team management tests (4 endpoints)
   • Advanced analytics tests (2 endpoints)
   • Reports tests (10 endpoints)
   • Core tracking tests (4 endpoints)
   • Website management tests (4 endpoints)
   • Data export tests (1 endpoint)
   • V1 API tests (2 endpoints)

🚀 Ready to run tests with new API key!
```

## 📊 Test Files Using Centralized Config

### ✅ Updated Files (All 35 endpoints)

| Category | File | Endpoints | Status |
|----------|------|-----------|---------|
| **Authentication** | `authentication/test-auth-flow.js` | 6 | ✅ Updated |
| **Authentication** | `authentication/test-auth-edge-cases.js` | - | ✅ Updated |
| **User Management** | `user-management/test-user-account.js` | 7 | ✅ Updated |
| **API Keys** | `api-keys/test-api-key-management.js` | 3 | ✅ Updated |
| **Team Management** | `team-management/test-team-operations.js` | 4 | ✅ Updated |
| **Advanced Analytics** | `advanced-analytics/test-realtime-active.js` | 2 | ✅ Updated |
| **Reports** | `reports/test-all-reports.js` | 10 | ✅ Updated |
| **Core Analytics** | `analytics/test-analytics-api.js` | 5 | ✅ Updated |
| **Website Management** | `website-management/test-website-management.js` | 4 | ✅ Updated |
| **Website Management** | `website-management/test-deletion-verification.js` | - | ✅ Updated |
| **Website Management** | `website-management/test-comprehensive-cleanup.js` | - | ✅ Updated |
| **Core Tracking** | `core-tracking/test-basic-api.js` | - | ✅ Updated |
| **Core Tracking** | `core-tracking/test-batch-api.js` | - | ✅ Updated |
| **Core Tracking** | `core-tracking/test-tracking-data.js` | - | ✅ Updated |
| **Core Tracking** | `test-complete-api-suite.js` | 4 | ✅ Updated |
| **Data Export** | `data-export/test-export-api.js` | 1 | ✅ Updated |
| **V1 API** | `v1-api/test-v1-api.js` | 2 | ✅ Updated |

## 🔧 Environment Configuration

### Development Environment
```javascript
const BASE_URL = 'http://localhost:3000';
```

### Staging Environment
```javascript
const BASE_URL = 'https://staging.superlytics.co';
```

### Production Environment (Testing Only)
```javascript
const BASE_URL = 'https://api.superlytics.co';
```

⚠️ **Important**: Never test against production with real user data!

## 🛡️ Security Best Practices

### ✅ Do:
- Keep API keys in the centralized config.js file
- Use environment-specific API keys
- Rotate test API keys regularly
- Use test data only, never production data
- Keep config.js in .gitignore if it contains sensitive keys

### ❌ Don't:
- Hardcode API keys in individual test files
- Commit production API keys to version control
- Use production API keys for testing
- Test against production endpoints

## 🎉 Benefits of Centralized Configuration

### 🎯 **Single Point of Control**
- Update API key in one place → affects all 35+ endpoint tests
- Change base URL once → affects all network requests
- Modify website ID globally → consistent across all tests

### 🚀 **Environment Flexibility**
```bash
# Switch to staging
sed -i 's/localhost:3000/staging.superlytics.co/g' config.js

# Switch back to development
sed -i 's/staging.superlytics.co/localhost:3000/g' config.js
```

### 🔧 **Easy Maintenance**
- No more hunting through files to update API keys
- Consistent configuration across all test categories
- Reduced chance of outdated keys in forgotten files

### 📊 **Developer Experience**
- New developers only need to update one file
- Clear separation of configuration from test logic
- Easy to understand and maintain

## 🔍 Verification Commands

### Check Configuration Loading
```bash
cd testing-scripts/api-tests
node -e "const {API_KEY, WEBSITE_ID, BASE_URL} = require('./config.js'); console.log('API Key:', API_KEY.substring(0,12)+'...'); console.log('Website ID:', WEBSITE_ID); console.log('Base URL:', BASE_URL);"
```

### Test Configuration from Subdirectory
```bash
cd testing-scripts/api-tests/reports
node -e "const {API_KEY, WEBSITE_ID, BASE_URL} = require('../config.js'); console.log('✅ Config loaded from subdirectory');"
```

### Find Any Remaining Hardcoded Keys
```bash
cd testing-scripts
grep -r "const API_KEY = 'sly_" . --exclude-dir=node_modules
# Should only show config.js and documentation files
```

---

*Last Updated: January 2025*  
*SuperLytics SaaS Platform - Centralized Testing Configuration* 🔧