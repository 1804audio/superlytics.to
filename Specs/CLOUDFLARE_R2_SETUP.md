# Cloudflare R2 Setup Guide

This guide will help you set up Cloudflare R2 storage for SuperLytics data exports.

## Overview

SuperLytics now uses Cloudflare R2 storage for data exports, providing:
- **Scalable Storage**: No server disk space limitations
- **Global CDN**: Fast downloads worldwide
- **Cost Effective**: ~$0.015/GB storage, $0 egress fees
- **S3 Compatible**: Uses AWS SDK for seamless integration
- **Presigned URLs**: Secure, time-limited download links

## Step 1: Create Cloudflare Account & R2 Bucket

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up or log in to your account
3. Navigate to **R2 Object Storage** in the sidebar
4. Click **Create Bucket**
5. Name your bucket (e.g., `superlytics-exports`)
6. Choose a location (auto is recommended)
7. Click **Create Bucket**

## Step 2: Create R2 API Token

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure the token:
   - **Token Name**: `SuperLytics Data Exports`
   - **Permissions**: `Object Read and Write`
   - **Bucket**: Select your created bucket
   - **TTL**: Never expire (or set as needed)
4. Click **Create API Token**
5. **Important**: Copy the Access Key ID and Secret Access Key - you won't see them again!

## Step 3: Get R2 Endpoint URL

1. In your R2 bucket dashboard, note your **Account ID**
2. Your R2 endpoint will be: `https://[ACCOUNT-ID].r2.cloudflarestorage.com`
3. Example: `https://abc123def456.r2.cloudflarestorage.com`

## Step 4: Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Cloudflare R2 Storage Configuration
R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
R2_REGION="auto"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"
R2_BUCKET_NAME="superlytics-exports"
```

**Replace the values with:**
- `your-account-id`: Your Cloudflare Account ID
- `your-r2-access-key-id`: Access Key ID from Step 2
- `your-r2-secret-access-key`: Secret Access Key from Step 2
- `superlytics-exports`: Your bucket name from Step 1

## Step 5: Test the Configuration

1. Restart your SuperLytics server
2. Run the test script:
   ```bash
   node testing-scripts/api-tests/data-export/test-r2-migration.js
   ```
3. Check server logs for R2 initialization:
   ```
   superlytics:r2-storage R2 storage initialized - bucket: superlytics-exports
   superlytics:data-export-service Using Cloudflare R2 storage for data exports
   ```

## Step 6: Test Data Export

1. Go to your SuperLytics dashboard
2. Navigate to **Settings** → **Data Export**
3. Click **Export My Data**
4. Check your email for download links
5. Verify links work and files download correctly

## Architecture Overview

```
User Request → Data Export Service → R2 Storage → Presigned URLs → Email → Direct Download
```

### Storage Structure in R2:
```
superlytics-exports/
└── exports/
    └── export_[userId]_[timestamp]_[random]/
        ├── metadata.json
        ├── websites.csv
        ├── events_[website].csv
        └── sessions_[website].csv
```

### Key Features:
- **Presigned URLs**: 1-hour expiry for security
- **Automatic Cleanup**: Files deleted after 24 hours
- **Fallback Support**: API route fallback if presigned URLs fail
- **Error Handling**: Comprehensive error logging and recovery

## Troubleshooting

### "R2 storage is not configured" Error
- Check all environment variables are set correctly
- Verify there are no extra spaces or quotes in values
- Restart the server after changing .env

### "Access Denied" Errors
- Verify API token has correct permissions (Object Read and Write)
- Check bucket name matches exactly
- Ensure Account ID in endpoint URL is correct

### Downloads Not Working
- Check presigned URL expiry (1 hour)
- Verify bucket CORS settings if accessing from browser
- Check server logs for R2 service errors

### Performance Issues
- Consider enabling R2 custom domains for better performance
- Monitor R2 usage in Cloudflare dashboard
- Check network connectivity to Cloudflare

## Cost Estimation

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015/GB/month
- **Class A Operations** (write/list): $4.50/million
- **Class B Operations** (read): $0.36/million
- **Egress**: $0 (free)

Example monthly cost for 1000 exports:
- Storage (1GB average): $0.015
- Operations (1000 uploads + downloads): ~$0.005
- **Total**: ~$0.02/month

## Security Best Practices

1. **API Token Scope**: Limit to specific bucket only
2. **Environment Security**: Keep .env file secure and never commit to git
3. **Presigned URL Expiry**: Keep short (1 hour) for security
4. **Bucket Access**: Use private buckets, not public
5. **Regular Rotation**: Rotate API tokens periodically

## Production Deployment

For production deployments:
1. Use separate R2 buckets for staging/production
2. Set up monitoring and alerting for R2 operations
3. Configure proper logging for debugging
4. Consider bucket versioning for data recovery
5. Set up lifecycle policies for automatic cleanup

## Support

For issues with this setup:
1. Check SuperLytics server logs with `DEBUG=superlytics:*`
2. Verify R2 configuration in Cloudflare dashboard
3. Test with the provided test script
4. Review error messages for specific issues

---

**Note**: This setup replaces the previous filesystem storage completely. There is no fallback to local storage - R2 configuration is required for data exports to work.