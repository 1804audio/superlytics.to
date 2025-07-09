# Superlytics Analytics API Documentation

## Overview

This document provides comprehensive API documentation for the Superlytics analytics platform, including all endpoints, authentication, request/response formats, and usage examples.

**Base URL**: `https://your-superlytics-domain.com/api`

## Table of Contents

1. [Authentication](#authentication)
2. [Core Analytics Endpoints](#core-analytics-endpoints)
3. [Website Management](#website-management)
4. [Custom Features](#custom-features)
5. [User & Team Management](#user--team-management)
6. [Reports & Analytics](#reports--analytics)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)

---

## Authentication

### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "username": "admin",
  "password": "your_password"
}
```

**Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "username": "admin",
    "role": "admin"
  }
}
```

### Using the Token

Include the JWT token in all authenticated requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Logout

```http
POST /api/auth/logout
```

---

## Core Analytics Endpoints

### Send Analytics Event

```http
POST /api/send
```

**Headers:**

```
Content-Type: application/json
User-Agent: <browser_user_agent>
```

**Request Body:**

```json
{
  "website": "website_id",
  "hostname": "example.com",
  "language": "en-US",
  "referrer": "https://google.com",
  "screen": "1920x1080",
  "title": "Page Title",
  "url": "/page-path",
  "name": "pageview"
}
```

**Event Types:**

- `pageview` - Page view tracking
- Custom events with additional data

**Response:**

```json
{
  "success": true
}
```

### Batch Analytics

```http
POST /api/batch
```

Send multiple events in a single request:

```json
{
  "events": [
    {
      "website": "website_id",
      "url": "/page1",
      "name": "pageview"
    },
    {
      "website": "website_id",
      "url": "/page2",
      "name": "pageview"
    }
  ]
}
```

---

## Website Management

### Create Website

```http
POST /api/websites
```

**Request Body:**

```json
{
  "name": "My Website",
  "domain": "example.com",
  "shareId": "optional_share_id"
}
```

**Response:**

```json
{
  "id": "website_id",
  "name": "My Website",
  "domain": "example.com",
  "shareId": "share_id",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Website Details

```http
GET /api/websites/{websiteId}
```

**Response:**

```json
{
  "id": "website_id",
  "name": "My Website",
  "domain": "example.com",
  "shareId": "share_id",
  "userId": "user_id",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### Update Website

```http
PUT /api/websites/{websiteId}
```

**Request Body:**

```json
{
  "name": "Updated Name",
  "domain": "newdomain.com"
}
```

### Delete Website

```http
DELETE /api/websites/{websiteId}
```

### Reset Website Data

```http
POST /api/websites/{websiteId}/reset
```

Removes all analytics data but keeps website configuration.

---

## Custom Features

### 🆕 URL-Specific Data Cleanup

```http
DELETE /api/websites/{websiteId}/cleanup
```

**Purpose**: Delete analytics data for specific URL paths while preserving other website data.

**Use Case**: Perfect for SaaS platforms where users create and delete individual pages/links.

**Request Body:**

```json
{
  "urlPath": "/user/page-to-delete",
  "deleteType": "exact",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z"
}
```

**Parameters:**

| Parameter    | Type     | Required | Description                                     |
| ------------ | -------- | -------- | ----------------------------------------------- |
| `urlPath`    | string   | ✅       | The URL path to delete data for                 |
| `deleteType` | enum     | ❌       | `exact`, `prefix`, `pattern` (default: `exact`) |
| `startDate`  | ISO 8601 | ❌       | Delete data from this date                      |
| `endDate`    | ISO 8601 | ❌       | Delete data until this date                     |

**Delete Types:**

- `exact`: Matches the exact URL path
- `prefix`: Matches URLs starting with the path
- `pattern`: Matches URLs containing the path

**Examples:**

1. **Delete specific page:**

```json
{
  "urlPath": "/user/john/page1",
  "deleteType": "exact"
}
```

2. **Delete all user pages:**

```json
{
  "urlPath": "/user/john/",
  "deleteType": "prefix"
}
```

3. **Delete with date range:**

```json
{
  "urlPath": "/campaign/summer2024",
  "deleteType": "exact",
  "startDate": "2024-06-01T00:00:00.000Z",
  "endDate": "2024-08-31T23:59:59.999Z"
}
```

**Response:**

```json
{
  "deletedEvents": 150,
  "deletedEventData": 75,
  "deletedSessions": 12,
  "deletedSessionData": 8
}
```

**Error Responses:**

```json
{
  "error": "Website not found"
}
```

---

## Website Analytics Data

### Get Website Stats

```http
GET /api/websites/{websiteId}/stats?startAt=timestamp&endAt=timestamp
```

**Query Parameters:**

- `startAt`: Start timestamp (Unix)
- `endAt`: End timestamp (Unix)
- `url`: Filter by URL path
- `referrer`: Filter by referrer
- `title`: Filter by page title
- `query`: Search query
- `event`: Filter by event name

**Response:**

```json
{
  "pageviews": {
    "value": 1250,
    "change": 15
  },
  "visitors": {
    "value": 892,
    "change": 8
  },
  "visits": {
    "value": 1100,
    "change": 12
  },
  "bounces": {
    "value": 45,
    "change": -3
  },
  "totaltime": {
    "value": 18500,
    "change": 5
  }
}
```

### Get Page Views

```http
GET /api/websites/{websiteId}/pageviews?startAt=timestamp&endAt=timestamp
```

**Response:**

```json
[
  {
    "x": "/home",
    "y": 450
  },
  {
    "x": "/about",
    "y": 200
  }
]
```

### Get Website Metrics

```http
GET /api/websites/{websiteId}/metrics?startAt=timestamp&endAt=timestamp&type=url
```

**Metric Types:**

- `url` - Page URLs
- `referrer` - Referrer sites
- `browser` - Browser types
- `os` - Operating systems
- `device` - Device types
- `country` - Countries
- `event` - Custom events

### Get Sessions

```http
GET /api/websites/{websiteId}/sessions?startAt=timestamp&endAt=timestamp
```

**Response:**

```json
{
  "data": [
    {
      "id": "session_id",
      "websiteId": "website_id",
      "hostname": "example.com",
      "browser": "Chrome",
      "os": "Windows",
      "device": "desktop",
      "screen": "1920x1080",
      "language": "en-US",
      "country": "US",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ],
  "count": 1,
  "page": 1,
  "pageSize": 50
}
```

### Get Events

```http
GET /api/websites/{websiteId}/events?startAt=timestamp&endAt=timestamp
```

### Get Real-time Data

```http
GET /api/websites/{websiteId}/active
```

**Response:**

```json
{
  "x": 25
}
```

### Get Date Range

```http
GET /api/websites/{websiteId}/daterange
```

**Response:**

```json
{
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-12-31T23:59:59.999Z"
}
```

---

## Reports & Analytics

### Create Report

```http
POST /api/reports
```

**Request Body:**

```json
{
  "websiteId": "website_id",
  "name": "Monthly Traffic Report",
  "description": "Traffic analysis for January",
  "type": "retention",
  "parameters": {}
}
```

### Get Reports

```http
GET /api/reports
```

### Funnel Analysis

```http
GET /api/reports/funnel?websiteId=id&startAt=timestamp&endAt=timestamp
```

**Query Parameters:**

```
websiteId=website_id
startAt=1704067200000
endAt=1706745599999
window=7
urls[]=/step1
urls[]=/step2
urls[]=/step3
```

### Retention Analysis

```http
GET /api/reports/retention?websiteId=id&startAt=timestamp&endAt=timestamp
```

### UTM Campaign Analysis

```http
GET /api/reports/utm?websiteId=id&startAt=timestamp&endAt=timestamp
```

### Revenue Analysis

```http
GET /api/reports/revenue?websiteId=id&startAt=timestamp&endAt=timestamp
```

### Journey Analysis

```http
GET /api/reports/journey?websiteId=id&startAt=timestamp&endAt=timestamp
```

### Insights

```http
GET /api/reports/insights?websiteId=id&startAt=timestamp&endAt=timestamp
```

---

## User & Team Management

### Get Current User

```http
GET /api/me
```

### Update Password

```http
POST /api/me/password
```

**Request Body:**

```json
{
  "currentPassword": "current_password",
  "newPassword": "new_password"
}
```

### Get User Websites

```http
GET /api/me/websites
```

### Create User (Admin Only)

```http
POST /api/users
```

**Request Body:**

```json
{
  "username": "newuser",
  "password": "password123",
  "role": "user"
}
```

### Get Users (Admin Only)

```http
GET /api/users
```

### Teams

```http
GET /api/teams
POST /api/teams
GET /api/teams/{teamId}
PUT /api/teams/{teamId}
DELETE /api/teams/{teamId}
```

---

## Share URLs

### Get Shared Website Data

```http
GET /api/share/{shareId}
```

Access website analytics via public share URL without authentication.

---

## Error Handling

### HTTP Status Codes

| Code | Meaning                                 |
| ---- | --------------------------------------- |
| 200  | Success                                 |
| 400  | Bad Request - Invalid parameters        |
| 401  | Unauthorized - Missing or invalid token |
| 403  | Forbidden - Insufficient permissions    |
| 404  | Not Found - Resource doesn't exist      |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error                   |

### Error Response Format

```json
{
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
```

---

## Rate Limiting

- **Analytics Events**: 1000 requests per minute
- **API Calls**: 100 requests per minute per user
- **Burst**: Up to 10 requests per second

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

---

## Common Use Cases

### 1. SaaS Platform Integration

```javascript
// Track user page creation
await fetch('/api/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    website: 'your_website_id',
    url: `/user/${userId}/new-page`,
    name: 'pageview',
  }),
});

// Delete analytics when user deletes page
await fetch(`/api/websites/${websiteId}/cleanup`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    urlPath: `/user/${userId}/deleted-page`,
    deleteType: 'exact',
  }),
});
```

### 2. Multi-tenant Analytics

```javascript
// Each user gets their own URL prefix
const userPrefix = `/user/${userId}/`;

// Clean up all user data when they delete account
await fetch(`/api/websites/${websiteId}/cleanup`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    urlPath: userPrefix,
    deleteType: 'prefix',
  }),
});
```

### 3. Campaign Analytics

```javascript
// Track campaign performance
await fetch('/api/send', {
  method: 'POST',
  body: JSON.stringify({
    website: websiteId,
    url: '/campaign/black-friday-2024',
    referrer: 'https://facebook.com',
    name: 'pageview',
  }),
});

// Clean up expired campaign data
await fetch(`/api/websites/${websiteId}/cleanup`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    urlPath: '/campaign/black-friday-2024',
    deleteType: 'exact',
    endDate: '2024-11-30T23:59:59.999Z',
  }),
});
```

---

## SDK Examples

### JavaScript/Node.js

```javascript
class SuperlyticsAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response.json();
  }

  async trackPageview(websiteId, url, title) {
    return this.request('/send', {
      method: 'POST',
      body: JSON.stringify({
        website: websiteId,
        url,
        title,
        name: 'pageview',
      }),
    });
  }

  async cleanupURL(websiteId, urlPath, options = {}) {
    return this.request(`/websites/${websiteId}/cleanup`, {
      method: 'DELETE',
      body: JSON.stringify({
        urlPath,
        deleteType: 'exact',
        ...options,
      }),
    });
  }

  async getStats(websiteId, startAt, endAt) {
    return this.request(`/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`);
  }
}
```

### Python

```python
import requests
import json
from datetime import datetime

class SuperlyticsAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def track_pageview(self, website_id, url, title=None):
        data = {
            'website': website_id,
            'url': url,
            'name': 'pageview'
        }
        if title:
            data['title'] = title

        response = requests.post(
            f'{self.base_url}/send',
            headers=self.headers,
            json=data
        )
        return response.json()

    def cleanup_url(self, website_id, url_path, delete_type='exact', start_date=None, end_date=None):
        data = {
            'urlPath': url_path,
            'deleteType': delete_type
        }
        if start_date:
            data['startDate'] = start_date.isoformat()
        if end_date:
            data['endDate'] = end_date.isoformat()

        response = requests.delete(
            f'{self.base_url}/websites/{website_id}/cleanup',
            headers=self.headers,
            json=data
        )
        return response.json()
```

---

## Testing

### Health Check

```http
GET /api/heartbeat
```

**Response:**

```json
{
  "ok": true
}
```

### Environment Info

```http
GET /api/me
```

Use this to verify authentication and get current user info.

---

This documentation covers all major Superlytics API endpoints including the new custom URL cleanup feature. The cleanup endpoint is particularly useful for SaaS platforms where users create and delete individual pages or links, allowing precise analytics data management without affecting other website data.
