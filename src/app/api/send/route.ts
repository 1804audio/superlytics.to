import { z } from 'zod';
import { isbot } from 'isbot';
import { startOfHour, startOfMonth } from 'date-fns';
import clickhouse from '@/lib/clickhouse';
import { parseRequest } from '@/lib/request';
import { badRequest, json, forbidden, serverError } from '@/lib/response';
import { fetchSession } from '@/lib/load';
import { getClientInfo, hasBlockedIp } from '@/lib/detect';
import { createToken, parseToken } from '@/lib/jwt';
import { secret, uuid, hash } from '@/lib/crypto';
// Initialize server services (schedulers, etc.) - this ensures they start when the API is first called
import '@/lib/server-init';
import { COLLECTION_TYPE } from '@/lib/constants';
import { anyObjectParam, urlOrPathParam } from '@/lib/schema';
import { safeDecodeURI, safeDecodeURIComponent } from '@/lib/url';
import { createSession, saveEvent, saveSessionData, getWebsiteWithUser } from '@/queries';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';

const schema = z.object({
  type: z.enum(['event', 'identify']),
  payload: z.object({
    website: z.string().uuid(),
    data: anyObjectParam.optional(),
    hostname: z.string().max(100).optional(),
    language: z.string().max(35).optional(),
    referrer: urlOrPathParam.optional(),
    screen: z.string().max(11).optional(),
    title: z.string().optional(),
    url: urlOrPathParam.optional(),
    name: z.string().max(50).optional(),
    tag: z.string().max(50).optional(),
    ip: z.union([z.ipv4(), z.ipv6()]).optional(),
    userAgent: z.string().optional(),
    timestamp: z.coerce.number().int().optional(),
    id: z.string().optional(),
  }),
});

export async function POST(request: Request) {
  try {
    const { body, error } = await parseRequest(request, schema, { skipAuth: true });

    if (error) {
      return error();
    }

    const { type, payload } = body;

    const {
      website: websiteId,
      hostname,
      screen,
      language,
      url,
      referrer,
      name,
      data,
      title,
      tag,
      timestamp,
      id,
    } = payload;

    // Cache check
    let cache: { websiteId: string; sessionId: string; visitId: string; iat: number } | null = null;
    const cacheHeader = request.headers.get('x-superlytics-cache');

    if (cacheHeader) {
      const result = await parseToken(cacheHeader, secret());

      if (result) {
        cache = result;
      }
    }

    // Find website and check plan limits
    let websiteOwnerUserId: string | null = null;

    // Always get website info for plan checking and usage counting
    // Cache is only used for session/visit data, not for billing validation
    const website = await getWebsiteWithUser(websiteId);

    if (!website) {
      return badRequest('Website not found.');
    }

    // Determine the owner for plan checking
    if (website.userId) {
      websiteOwnerUserId = website.userId;
    } else if (website.team?.teamUser?.[0]?.user) {
      websiteOwnerUserId = website.team.teamUser[0].user.id;
    }

    // Check if the website owner has access and their event limits
    if (websiteOwnerUserId) {
      // Check if user has access
      const ownerUser = website.user || website.team?.teamUser?.[0]?.user;
      if (!ownerUser?.hasAccess) {
        return forbidden();
      }

      // Check event limits before processing
      const canTrack = await simpleUsageManager.checkEventLimit(websiteOwnerUserId);
      if (!canTrack) {
        return Response.json(
          {
            error: 'Event tracking limit exceeded',
            code: 'LIMIT_EXCEEDED',
          },
          { status: 429 },
        );
      }
    }

    // Client info
    const { ip, userAgent, device, browser, os, country, region, city } = await getClientInfo(
      request,
      payload,
    );

    // Bot check
    if (!process.env.DISABLE_BOT_CHECK && isbot(userAgent)) {
      return json({ beep: 'boop' });
    }

    // IP block
    if (hasBlockedIp(ip)) {
      return forbidden();
    }

    const createdAt = timestamp ? new Date(timestamp * 1000) : new Date();
    const now = Math.floor(new Date().getTime() / 1000);

    const sessionSalt = hash(startOfMonth(createdAt).toUTCString());
    const visitSalt = hash(startOfHour(createdAt).toUTCString());

    const sessionId = id ? uuid(websiteId, id) : uuid(websiteId, ip, userAgent, sessionSalt);

    // Find session
    if (!clickhouse.enabled && !cache?.sessionId) {
      const session = await fetchSession(websiteId, sessionId);

      // Create a session if not found
      if (!session) {
        try {
          await createSession({
            id: sessionId,
            websiteId,
            browser,
            os,
            device,
            screen,
            language,
            country,
            region,
            city,
            distinctId: id,
          });
        } catch (e: any) {
          if (!e.message.toLowerCase().includes('unique constraint')) {
            return serverError(e);
          }
        }
      }
    }

    // Visit info
    let visitId = cache?.visitId || uuid(sessionId, visitSalt);
    let iat = cache?.iat || now;

    // Expire visit after 30 minutes
    if (!timestamp && now - iat > 1800) {
      visitId = uuid(sessionId, visitSalt);
      iat = now;
    }

    if (type === COLLECTION_TYPE.event) {
      const base = hostname ? `https://${hostname}` : 'https://localhost';
      const currentUrl = new URL(url, base);

      let urlPath =
        currentUrl.pathname === '/undefined' ? '' : currentUrl.pathname + currentUrl.hash;
      const urlQuery = currentUrl.search.substring(1);
      const urlDomain = currentUrl.hostname.replace(/^www./, '');

      let referrerPath: string;
      let referrerQuery: string;
      let referrerDomain: string;

      // UTM Params
      const utmSource = currentUrl.searchParams.get('utm_source');
      const utmMedium = currentUrl.searchParams.get('utm_medium');
      const utmCampaign = currentUrl.searchParams.get('utm_campaign');
      const utmContent = currentUrl.searchParams.get('utm_content');
      const utmTerm = currentUrl.searchParams.get('utm_term');

      // Click IDs
      const gclid = currentUrl.searchParams.get('gclid');
      const fbclid = currentUrl.searchParams.get('fbclid');
      const msclkid = currentUrl.searchParams.get('msclkid');
      const ttclid = currentUrl.searchParams.get('ttclid');
      const lifatid = currentUrl.searchParams.get('li_fat_id');
      const twclid = currentUrl.searchParams.get('twclid');

      if (process.env.REMOVE_TRAILING_SLASH) {
        urlPath = urlPath.replace(/\/(?=(#.*)?$)/, '');
      }

      if (referrer) {
        const referrerUrl = new URL(referrer, base);

        referrerPath = referrerUrl.pathname;
        referrerQuery = referrerUrl.search.substring(1);

        if (referrerUrl.hostname !== 'localhost') {
          referrerDomain = referrerUrl.hostname.replace(/^www\./, '');
        }
      }

      await saveEvent({
        websiteId,
        sessionId,
        visitId,
        createdAt,

        // Page
        pageTitle: safeDecodeURIComponent(title),
        hostname: hostname || urlDomain,
        urlPath: safeDecodeURI(urlPath),
        urlQuery,
        referrerPath: safeDecodeURI(referrerPath),
        referrerQuery,
        referrerDomain,

        // Session
        distinctId: id,
        browser,
        os,
        device,
        screen,
        language,
        country,
        region,
        city,

        // Events
        eventName: name,
        eventData: data,
        tag,

        // UTM
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        utmTerm,

        // Click IDs
        gclid,
        fbclid,
        msclkid,
        ttclid,
        lifatid,
        twclid,
      });

      // Increment usage counter for the website owner after successful event save
      // Use the same date as the event to ensure consistency
      if (websiteOwnerUserId) {
        await simpleUsageManager.incrementEvents(websiteOwnerUserId, 1, createdAt);
      }
    }

    if (type === COLLECTION_TYPE.identify) {
      if (data) {
        await saveSessionData({
          websiteId,
          sessionId,
          sessionData: data,
          distinctId: id,
          createdAt,
        });
      }
    }

    const token = createToken({ websiteId, sessionId, visitId, iat }, secret());

    return json({ cache: token, sessionId, visitId });
  } catch (e) {
    return serverError(e);
  }
}
