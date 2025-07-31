import { emailService } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import prismaHelpers from '@/lib/prisma';
import { runQuery, CLICKHOUSE, PRISMA } from '@/lib/db';
import clickhouse from '@/lib/clickhouse';
import { r2StorageService } from '@/lib/services/r2-storage-service';
import { format } from 'date-fns';
import debug from 'debug';

const log = debug('superlytics:data-export-service');

interface ExportFile {
  filename: string;
  content: string;
  size: string;
}

interface DownloadLink {
  filename: string;
  url: string;
  size: string;
}

class DataExportService {
  private appUrl: string;

  constructor() {
    this.appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superlytics.co';

    if (!r2StorageService.isEnabled()) {
      throw new Error('R2 storage is not configured. Please set R2 environment variables.');
    }

    log('Using Cloudflare R2 storage for data exports');
  }

  async exportUserData(userId: string, userEmail: string, username: string): Promise<boolean> {
    try {
      log(`Starting data export for user ${userId}`);

      // Generate all export files
      const exportFiles = await this.generateExportFiles(userId);

      // Store files in R2
      const exportId = this.generateExportId(userId);
      log(`Generated export ID: ${exportId}`);
      log(`Storing ${exportFiles.length} files in R2`);

      await r2StorageService.storeExportFiles(exportId, exportFiles);
      log(`Files stored successfully in R2 for export ${exportId}`);

      // Cleanup handled automatically by R2 Lifecycle Rules (24 hours)
      log(
        `Export ${exportId} will be automatically cleaned up by R2 Lifecycle Rules after 24 hours`,
      );

      // Generate presigned download URLs for R2
      const downloadLinks: DownloadLink[] = [];
      for (const file of exportFiles) {
        const presignedUrl = await r2StorageService.getDownloadUrl(
          `exports/${exportId}/${file.filename}`,
          3600,
        ); // 1 hour expiry
        if (presignedUrl) {
          downloadLinks.push({
            filename: file.filename,
            url: presignedUrl,
            size: file.size,
          });
        } else {
          log(`Failed to generate download URL for ${file.filename}`);
          // Fallback to API route if presigned URL fails
          downloadLinks.push({
            filename: file.filename,
            url: `${this.appUrl}/api/exports/${exportId}/${encodeURIComponent(file.filename)}`,
            size: file.size,
          });
        }
      }

      // Send success email
      const emailSent = await emailService.sendDataExportReady(userEmail, username, downloadLinks);

      if (emailSent) {
        log(`Data export completed successfully for user ${userId}`);
        return true;
      } else {
        log(`Export completed but email failed for user ${userId}`);
        return false;
      }
    } catch (error) {
      log(`Data export failed for user ${userId}:`, error);

      // Send failure email
      await emailService.sendDataExportFailed(
        userEmail,
        username,
        error instanceof Error ? error.message : 'Unknown error',
      );

      return false;
    }
  }

  private async generateExportFiles(userId: string): Promise<ExportFile[]> {
    const files: ExportFile[] = [];

    // Get user's websites
    const websites = await this.getUserWebsites(userId);

    if (websites.length === 0) {
      log(`No websites found for user ${userId}`);
      // Still create an empty export
      files.push({
        filename: 'websites.csv',
        content: 'name,domain,created_at\n',
        size: '24 B',
      });
      return files;
    }

    // Export websites
    files.push(await this.exportWebsites(websites));

    // Export website events for each website
    for (const website of websites) {
      const eventsFile = await this.exportWebsiteEvents(website.id, website.name);
      if (eventsFile) {
        files.push(eventsFile);
      }

      const sessionsFile = await this.exportWebsiteSessions(website.id, website.name);
      if (sessionsFile) {
        files.push(sessionsFile);
      }
    }

    // Export user reports
    const reportsFile = await this.exportUserReports(userId);
    if (reportsFile) {
      files.push(reportsFile);
    }

    return files;
  }

  private async getUserWebsites(userId: string) {
    return await prisma.website.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async exportWebsites(websites: any[]): Promise<ExportFile> {
    const csvContent = [
      'name,domain,created_at',
      ...websites.map(
        w => `"${w.name}","${w.domain}","${format(w.createdAt, 'yyyy-MM-dd HH:mm:ss')}"`,
      ),
    ].join('\n');

    return {
      filename: 'websites.csv',
      content: csvContent,
      size: this.formatFileSize(csvContent.length),
    };
  }

  private async exportWebsiteEvents(
    websiteId: string,
    websiteName: string,
  ): Promise<ExportFile | null> {
    try {
      const events = await runQuery({
        [PRISMA]: () => this.getEventsFromPrisma(websiteId),
        [CLICKHOUSE]: () => this.getEventsFromClickhouse(websiteId),
      });

      if (events.length === 0) {
        log(`No events found for website ${websiteId}`);
        return null;
      }

      const csvContent = [
        'event_name,url_path,created_at,session_id,browser,os,device,country,referrer_domain',
        ...events.map(
          event =>
            `"${event.eventName || 'pageview'}","${event.urlPath || ''}","${format(new Date(event.createdAt), 'yyyy-MM-dd HH:mm:ss')}","${event.sessionId || ''}","${event.browser || ''}","${event.os || ''}","${event.device || ''}","${event.country || ''}","${event.referrerDomain || ''}"`,
        ),
      ].join('\n');

      const safeWebsiteName = websiteName.replace(/[^a-zA-Z0-9-_]/g, '_');

      return {
        filename: `events_${safeWebsiteName}.csv`,
        content: csvContent,
        size: this.formatFileSize(csvContent.length),
      };
    } catch (error) {
      log(`Failed to export events for website ${websiteId}:`, error);
      return null;
    }
  }

  private async exportWebsiteSessions(
    websiteId: string,
    websiteName: string,
  ): Promise<ExportFile | null> {
    try {
      const sessions = await runQuery({
        [PRISMA]: () => this.getSessionsFromPrisma(websiteId),
        [CLICKHOUSE]: () => this.getSessionsFromClickhouse(websiteId),
      });

      if (sessions.length === 0) {
        log(`No sessions found for website ${websiteId}`);
        return null;
      }

      const csvContent = [
        'session_id,created_at,browser,os,device,country,language,screen_resolution',
        ...sessions.map(
          session =>
            `"${session.sessionId}","${format(new Date(session.createdAt), 'yyyy-MM-dd HH:mm:ss')}","${session.browser || ''}","${session.os || ''}","${session.device || ''}","${session.country || ''}","${session.language || ''}","${session.screen || ''}"`,
        ),
      ].join('\n');

      const safeWebsiteName = websiteName.replace(/[^a-zA-Z0-9-_]/g, '_');

      return {
        filename: `sessions_${safeWebsiteName}.csv`,
        content: csvContent,
        size: this.formatFileSize(csvContent.length),
      };
    } catch (error) {
      log(`Failed to export sessions for website ${websiteId}:`, error);
      return null;
    }
  }

  private async exportUserReports(userId: string): Promise<ExportFile | null> {
    try {
      const reports = await prisma.report.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          type: true,
          parameters: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (reports.length === 0) {
        log(`No reports found for user ${userId}`);
        return null;
      }

      const csvContent = [
        'name,type,parameters,created_at,updated_at',
        ...reports.map(
          report =>
            `"${report.name}","${report.type}","${JSON.stringify(report.parameters).replace(/"/g, '""')}","${format(report.createdAt, 'yyyy-MM-dd HH:mm:ss')}","${format(report.updatedAt, 'yyyy-MM-dd HH:mm:ss')}"`,
        ),
      ].join('\n');

      return {
        filename: 'reports.csv',
        content: csvContent,
        size: this.formatFileSize(csvContent.length),
      };
    } catch (error) {
      log(`Failed to export reports for user ${userId}:`, error);
      return null;
    }
  }

  private async getEventsFromPrisma(websiteId: string) {
    const { rawQuery, parseFilters } = prismaHelpers;
    const { params } = await parseFilters(websiteId, {});

    return rawQuery(
      `
      select
          website_event.event_name as "eventName",
          website_event.url_path as "urlPath",
          website_event.created_at as "createdAt",
          website_event.session_id as "sessionId",
          session.browser,
          session.os,
          session.device,
          session.country,
          website_event.referrer_domain as "referrerDomain"
      from website_event
      inner join session on session.session_id = website_event.session_id
      where website_event.website_id = {{websiteId::uuid}}
      order by website_event.created_at desc
      limit 10000
      `,
      params,
    );
  }

  private async getEventsFromClickhouse(websiteId: string) {
    const { rawQuery, parseFilters } = clickhouse;
    const { params } = await parseFilters(websiteId, {});

    return rawQuery(
      `
      select
          event_name as eventName,
          url_path as urlPath,
          created_at as createdAt,
          session_id as sessionId,
          browser,
          os,
          device,
          country,
          referrer_domain as referrerDomain
      from website_event
      where website_id = {websiteId:UUID}
      order by createdAt desc
      limit 10000
      `,
      params,
    );
  }

  private async getSessionsFromPrisma(websiteId: string) {
    const { rawQuery, parseFilters } = prismaHelpers;
    const { params } = await parseFilters(websiteId, {});

    return rawQuery(
      `
      select
          session.session_id as "sessionId",
          session.created_at as "createdAt",
          session.browser,
          session.os,
          session.device,
          session.country,
          session.language,
          session.screen
      from session
      where session.website_id = {{websiteId::uuid}}
      order by session.created_at desc
      limit 10000
      `,
      params,
    );
  }

  private async getSessionsFromClickhouse(websiteId: string) {
    const { rawQuery, parseFilters } = clickhouse;
    const { params } = await parseFilters(websiteId, {});

    return rawQuery(
      `
      select
          session_id as sessionId,
          created_at as createdAt,
          browser,
          os,
          device,
          country,
          language,
          screen
      from session
      where website_id = {websiteId:UUID}
      order by createdAt desc
      limit 10000
      `,
      params,
    );
  }

  private generateExportId(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `export_${userId}_${timestamp}_${random}`;
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // Public method to retrieve export files for download
  async getExportFile(exportId: string, filename: string): Promise<ExportFile | null> {
    log(`Looking for export ${exportId}, file ${filename}`);

    try {
      const result = await r2StorageService.getExportFile(exportId, filename);

      if (!result) {
        log(`File ${filename} not found in export ${exportId}`);
        return null;
      }

      log(`Successfully retrieved file ${filename} (${result.size})`);

      return {
        filename,
        content: result.content,
        size: result.size,
      };
    } catch (error) {
      log(`Error retrieving export file:`, error);
      return null;
    }
  }

  // Public method to check if export exists
  async exportExists(exportId: string): Promise<boolean> {
    try {
      const exists = await r2StorageService.exportExists(exportId);
      log(`Export ${exportId} exists: ${exists}`);
      return exists;
    } catch (error) {
      log(`Error checking export existence:`, error);
      return false;
    }
  }
}

export const dataExportService = new DataExportService();
