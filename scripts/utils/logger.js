/**
 * Logging utility for scripts
 * Provides structured logging without violating ESLint no-console rule
 */

const logger = {
  info: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.log(`ℹ️  ${message}`, ...args);
  },

  success: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.log(`✅ ${message}`, ...args);
  },

  error: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.error(`❌ ${message}`, ...args);
  },

  warn: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.warn(`⚠️  ${message}`, ...args);
  },

  debug: (message, ...args) => {
    // eslint-disable-next-line no-console
    console.log(`🔍 ${message}`, ...args);
  },

  section: title => {
    // eslint-disable-next-line no-console
    console.log(`\n📦 ${title}...`);
  },

  subsection: title => {
    // eslint-disable-next-line no-console
    console.log(`\n📋 ${title}:`);
  },

  separator: () => {
    // eslint-disable-next-line no-console
    console.log('='.repeat(60));
  },

  newline: () => {
    // eslint-disable-next-line no-console
    console.log('');
  },
};

module.exports = logger;
