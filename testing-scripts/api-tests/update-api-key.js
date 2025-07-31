#!/usr/bin/env node

/**
 * API Key Update Utility
 *
 * This script demonstrates how easy it is to update the API key
 * across all test files using the centralized configuration.
 *
 * Usage:
 *   node update-api-key.js your_new_api_key_here
 *
 * Example:
 *   node update-api-key.js sly_new12345abcdef67890
 */

const fs = require('fs');
const path = require('path');

function updateApiKey(newApiKey) {
  const configPath = path.join(__dirname, 'config.js');

  // Validate the new API key format
  if (!newApiKey || !newApiKey.startsWith('sly_')) {
    console.error('❌ Error: API key must start with "sly_"');
    console.log('   Example: sly_bb5f9889f804da5e6c4846a467d06779903d39b0');
    process.exit(1);
  }

  try {
    // Read the current config file
    let configContent = fs.readFileSync(configPath, 'utf8');

    // Extract the current API key
    const currentKeyMatch = configContent.match(/const API_KEY = '(sly_[^']+)';/);
    const currentKey = currentKeyMatch ? currentKeyMatch[1] : 'unknown';

    // Replace the API key
    const updatedContent = configContent.replace(
      /const API_KEY = 'sly_[^']+';/,
      `const API_KEY = '${newApiKey}';`,
    );

    // Write the updated config
    fs.writeFileSync(configPath, updatedContent, 'utf8');

    console.log('✅ API Key Updated Successfully!');
    console.log(`   Old key: ${currentKey.substring(0, 12)}...`);
    console.log(`   New key: ${newApiKey.substring(0, 12)}...`);
    console.log('');
    console.log('🎯 All test files will now use the new API key automatically!');
    console.log('   No need to update individual test files.');
    console.log('');
    console.log('📊 Test files that will use the new key:');
    console.log('   • Authentication tests (6 endpoints)');
    console.log('   • User management tests (7 endpoints)');
    console.log('   • API key management tests (3 endpoints)');
    console.log('   • Team management tests (4 endpoints)');
    console.log('   • Advanced analytics tests (2 endpoints)');
    console.log('   • Reports tests (10 endpoints)');
    console.log('   • Core tracking tests (4 endpoints)');
    console.log('   • Website management tests (4 endpoints)');
    console.log('   • Data export tests (1 endpoint)');
    console.log('   • V1 API tests (2 endpoints)');
    console.log('');
    console.log('🚀 Ready to run tests with new API key!');
  } catch (error) {
    console.error('❌ Error updating API key:', error.message);
    process.exit(1);
  }
}

// Main execution
if (require.main === module) {
  const newApiKey = process.argv[2];

  if (!newApiKey) {
    console.log('🔑 API Key Update Utility');
    console.log('=========================');
    console.log('');
    console.log('Usage: node update-api-key.js <new_api_key>');
    console.log('');
    console.log('Example:');
    console.log('  node update-api-key.js sly_new12345abcdef67890');
    console.log('');
    console.log('This will update the API key in config.js and all test files');
    console.log('will automatically use the new key without any changes needed.');
    process.exit(0);
  }

  updateApiKey(newApiKey);
}

module.exports = { updateApiKey };
