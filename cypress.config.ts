import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
  },
  // default username / password on init
  env: {
    superlytics_user: 'admin',
    superlytics_password: 'superlytics',
    superlytics_user_id: '41e2b680-648e-4b09-bcd7-3e2b10c06264',
  },
});
