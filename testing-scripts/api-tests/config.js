/**
 * Centralized Configuration for SuperLytics API Tests
 *
 * Update API keys, website IDs, and other test configurations here.
 * All test files will import these values automatically.
 */

// Main API Key for testing (update this to change across all tests)
const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';

// Test Website ID (update if needed)
const WEBSITE_ID = '77b5aae8-8e1c-4604-a4cc-a4de2b9e3b7e';

// Base URL for API calls
const BASE_URL = 'http://localhost:3000';

// Additional configuration constants
const CONFIG = {
  // Request timeout in milliseconds
  REQUEST_TIMEOUT: 30000,

  // Default timezone for tests
  DEFAULT_TIMEZONE: 'America/New_York',

  // Test data prefixes to avoid conflicts
  TEST_PREFIX: 'AutoTest',

  // Common headers
  HEADERS: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  },

  // Test timeouts
  TIMEOUTS: {
    SHORT: 5000, // 5 seconds
    MEDIUM: 15000, // 15 seconds
    LONG: 30000, // 30 seconds
  },
};

module.exports = {
  API_KEY,
  WEBSITE_ID,
  BASE_URL,
  CONFIG,
};
