# R2 Automatic Cleanup with Lifecycle Rules

This guide explains how to set up automatic cleanup for SuperLytics data exports using Cloudflare R2 Object Lifecycle Rules.

## Why Lifecycle Rules?

The current `setTimeout` cleanup has limitations:
- ❌ Only works if server runs continuously for 24 hours
- ❌ Server restarts lose cleanup timers
- ❌ Not suitable for serverless/production environments
- ❌ No guarantee cleanup will execute

**R2 Lifecycle Rules** provide:
- ✅ Automatic cleanup regardless of server state
- ✅ Guaranteed execution by Cloudflare
- ✅ No server resources required
- ✅ Production-ready reliability

## Setting Up R2 Lifecycle Rules

### Step 1: Access Your R2 Bucket Settings

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2 Object Storage**
3. Click on your `superlytics-exports` bucket
4. Click **Object Lifecycle Rules** in the sidebar

### Step 2: Create Lifecycle Rule

Click **Add Rule** and configure:

**Rule Name:** 
```
SuperLytics Export Cleanup
```

**Rule Status:** 
```
✅ Enabled
```

**Object Filters:**
```
Prefix: exports/
```

**Actions:**
```
✅ Delete objects after: 1 days
```

**Rule Configuration:**
```yaml
Rule Name: SuperLytics Export Cleanup
Status: Enabled
Filter:
  - Prefix: exports/
Actions:
  - Delete after: 1 day(s)
```

### Step 3: Verify Rule

After creating the rule, you should see:
```
✅ SuperLytics Export Cleanup
   Filter: Prefix "exports/"
   Action: Delete after 1 day
   Status: Enabled
```

## Testing Lifecycle Rules

Unfortunately, lifecycle rules can't be tested immediately since they run on Cloudflare's schedule. However, you can test the cleanup functionality using our test endpoints:

### Manual Testing Approach

1. **Create test exports:**
   ```bash
   node testing-scripts/api-tests/data-export/test-cleanup-working.js
   ```

2. **Test immediate cleanup:**
   ```bash
   # Test specific export cleanup
   curl -X POST http://localhost:3000/api/admin/cleanup-test \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-api-key" \
     -d '{"action": "cleanup_export", "exportId": "export_123_456_abc"}'
   ```

3. **Test bulk cleanup:**
   ```bash
   # Cleanup exports older than 30 minutes (for testing)
   curl -X POST http://localhost:3000/api/admin/cleanup-test \
     -H "Content-Type: application/json" \
     -H "x-api-key: your-api-key" \
     -d '{"action": "cleanup_old_exports", "maxAge": 30}'
   ```

### Verification Steps

1. **List current exports:**
   ```bash
   curl -X GET http://localhost:3000/api/admin/cleanup-test \
     -H "x-api-key: your-api-key"
   ```

2. **Create test export and wait 24+ hours**
3. **Check if lifecycle rule deleted it automatically**

## Alternative: Scheduled Cleanup Job

If you prefer server-side control, create a scheduled cleanup job:

### Option 1: Cron Job (Linux/Mac)

Add to your server's crontab:
```bash
# Run cleanup daily at 2 AM
0 2 * * * curl -X POST http://your-domain.com/api/admin/cleanup-test \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{"action": "cleanup_old_exports", "maxAge": 1440}'
```

### Option 2: GitHub Actions (for automated deployments)

Create `.github/workflows/cleanup.yml`:
```yaml
name: R2 Export Cleanup
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Old Exports
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/admin/cleanup-test \
            -H "Content-Type: application/json" \
            -H "x-api-key: ${{ secrets.API_KEY }}" \
            -d '{"action": "cleanup_old_exports", "maxAge": 1440}'
```

### Option 3: Cloudflare Workers (Serverless)

Create a Cloudflare Worker for scheduled cleanup:
```javascript
export default {
  async scheduled(event, env, ctx) {
    const response = await fetch(`${env.APP_URL}/api/admin/cleanup-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.API_KEY
      },
      body: JSON.stringify({
        action: 'cleanup_old_exports',
        maxAge: 1440 // 24 hours
      })
    });
    
    console.log('Cleanup result:', await response.text());
  }
};
```

## Monitoring Cleanup

### Log Monitoring

Check cleanup operations in your application logs:
```bash
DEBUG=superlytics:* npm start
```

Look for:
```
superlytics:r2-storage Cleaned up R2 export: export_123_456_abc
superlytics:cleanup-test Cleanup export_123_456_abc: SUCCESS
```

### R2 Dashboard Monitoring

1. Go to your R2 bucket dashboard
2. Check **Objects** tab for export count over time
3. Monitor **Metrics** for delete operations

### Setup Alerts

Consider setting up alerts for:
- High number of export files (indicates cleanup issues)
- R2 storage costs increasing unexpectedly
- Cleanup endpoint failures

## Production Recommendations

1. **Primary:** Use R2 Lifecycle Rules (most reliable)
2. **Backup:** Implement scheduled cleanup job
3. **Monitoring:** Set up alerts for storage growth
4. **Testing:** Run cleanup tests monthly

## Troubleshooting

### Lifecycle Rules Not Working
- Verify rule is **Enabled**
- Check prefix matches your file structure: `exports/`
- Rules may take 24-48 hours to take effect initially
- Contact Cloudflare support if issues persist

### Manual Cleanup Failing
- Check R2 API permissions (Object Read and Write)
- Verify bucket name and endpoint configuration
- Check server logs for detailed error messages
- Test with cleanup test endpoint first

### High Storage Costs
- Check if lifecycle rules are running
- Verify export file sizes are reasonable
- Monitor for failed cleanup operations
- Consider shorter retention periods if needed

---

**Note:** R2 Lifecycle Rules are the recommended production solution for automatic cleanup. The test endpoints are primarily for development and verification purposes.