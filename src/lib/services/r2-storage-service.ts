import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import debug from 'debug';

const log = debug('superlytics:r2-storage');

interface R2Config {
  endpoint: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

interface StoredFile {
  key: string;
  content: string | Buffer;
  contentType?: string;
  metadata?: Record<string, string>;
}

interface FileInfo {
  key: string;
  size: number;
  lastModified: Date;
  url?: string;
}

class R2StorageService {
  private client: S3Client;
  private bucketName: string;
  private enabled: boolean;

  constructor() {
    // Check if R2 is configured
    this.enabled = !!(
      process.env.R2_ENDPOINT &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    );

    if (!this.enabled) {
      log('R2 storage not configured - missing environment variables');
      return;
    }

    const config: R2Config = {
      endpoint: process.env.R2_ENDPOINT!,
      region: process.env.R2_REGION || 'auto',
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucketName: process.env.R2_BUCKET_NAME!,
    };

    this.bucketName = config.bucketName;

    // Initialize S3 client for R2
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // R2 is S3-compatible
      forcePathStyle: false,
    });

    log(`R2 storage initialized - bucket: ${this.bucketName}, endpoint: ${config.endpoint}`);
  }

  /**
   * Check if R2 storage is enabled and configured
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Store a file in R2 storage
   */
  async storeFile(file: StoredFile): Promise<boolean> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: file.key,
        Body: file.content,
        ContentType: file.contentType || 'application/octet-stream',
        Metadata: file.metadata || {},
      });

      await this.client.send(command);
      log(`Successfully stored file: ${file.key}`);
      return true;
    } catch (error) {
      log(`Failed to store file ${file.key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a file from R2 storage
   */
  async getFile(
    key: string,
  ): Promise<{ content: string; metadata?: Record<string, string> } | null> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);

      if (!response.Body) {
        log(`File not found: ${key}`);
        return null;
      }

      // Convert stream to string
      const content = await response.Body.transformToString();

      log(`Successfully retrieved file: ${key} (${content.length} bytes)`);

      return {
        content,
        metadata: response.Metadata,
      };
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        log(`File not found: ${key}`);
        return null;
      }
      log(`Failed to retrieve file ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a presigned URL for secure file download
   */
  async getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.client, command, { expiresIn });
      log(`Generated download URL for: ${key} (expires in ${expiresIn}s)`);

      return url;
    } catch (error) {
      log(`Failed to generate download URL for ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a file from R2 storage
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.client.send(command);
      log(`Successfully deleted file: ${key}`);
      return true;
    } catch (error) {
      log(`Failed to delete file ${key}:`, error);
      throw error;
    }
  }

  /**
   * List files with a prefix (e.g., all files in an export)
   */
  async listFiles(prefix: string): Promise<FileInfo[]> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
      });

      const response = await this.client.send(command);

      if (!response.Contents) {
        return [];
      }

      const files: FileInfo[] = response.Contents.map(obj => ({
        key: obj.Key!,
        size: obj.Size || 0,
        lastModified: obj.LastModified || new Date(),
      }));

      log(`Listed ${files.length} files with prefix: ${prefix}`);
      return files;
    } catch (error) {
      log(`Failed to list files with prefix ${prefix}:`, error);
      throw error;
    }
  }

  /**
   * Delete all files with a prefix (cleanup an entire export)
   */
  async deletePrefix(prefix: string): Promise<boolean> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    try {
      // First, list all files with the prefix
      const files = await this.listFiles(prefix);

      if (files.length === 0) {
        log(`No files found with prefix: ${prefix}`);
        return true;
      }

      // Delete each file
      const deletePromises = files.map(file => this.deleteFile(file.key));
      await Promise.all(deletePromises);

      log(`Successfully deleted ${files.length} files with prefix: ${prefix}`);
      return true;
    } catch (error) {
      log(`Failed to delete files with prefix ${prefix}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(key: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      // Just try to get metadata (HEAD request equivalent)
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey') {
        return false;
      }
      log(`Error checking file existence ${key}:`, error);
      throw error;
    }
  }

  /**
   * Store multiple files for an export
   */
  async storeExportFiles(
    exportId: string,
    files: Array<{ filename: string; content: string; size: string }>,
  ): Promise<string[]> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    const storedKeys: string[] = [];

    try {
      // Store metadata file
      const metadata = {
        exportId,
        timestamp: Date.now(),
        files: files.map(f => ({ filename: f.filename, size: f.size })),
      };

      const metadataKey = `exports/${exportId}/metadata.json`;
      await this.storeFile({
        key: metadataKey,
        content: JSON.stringify(metadata, null, 2),
        contentType: 'application/json',
        metadata: { exportId, type: 'metadata' },
      });
      storedKeys.push(metadataKey);

      // Store each export file
      for (const file of files) {
        const fileKey = `exports/${exportId}/${file.filename}`;
        await this.storeFile({
          key: fileKey,
          content: file.content,
          contentType: 'text/csv',
          metadata: { exportId, filename: file.filename, size: file.size },
        });
        storedKeys.push(fileKey);
      }

      log(`Stored ${files.length + 1} files for export ${exportId}`);
      return storedKeys;
    } catch (error) {
      log(`Failed to store export files for ${exportId}:`, error);
      // Cleanup any files that were stored
      for (const key of storedKeys) {
        try {
          await this.deleteFile(key);
        } catch (cleanupError) {
          log(`Failed to cleanup file during error: ${key}`, cleanupError);
        }
      }
      throw error;
    }
  }

  /**
   * Get an export file with metadata
   */
  async getExportFile(
    exportId: string,
    filename: string,
  ): Promise<{ content: string; size: string } | null> {
    if (!this.enabled) {
      throw new Error('R2 storage not configured');
    }

    const fileKey = `exports/${exportId}/${filename}`;

    try {
      const result = await this.getFile(fileKey);
      if (!result) {
        return null;
      }

      // Get size from metadata or calculate it
      const size = result.metadata?.size || this.formatFileSize(result.content.length);

      return {
        content: result.content,
        size,
      };
    } catch (error) {
      log(`Failed to get export file ${exportId}/${filename}:`, error);
      return null;
    }
  }

  /**
   * Check if an export exists
   */
  async exportExists(exportId: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const metadataKey = `exports/${exportId}/metadata.json`;
    return await this.fileExists(metadataKey);
  }

  /**
   * Cleanup an entire export (delete all files)
   */
  async cleanupExport(exportId: string): Promise<boolean> {
    if (!this.enabled) {
      return false;
    }

    const prefix = `exports/${exportId}/`;
    return await this.deletePrefix(prefix);
  }

  /**
   * Format file size in human readable format
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

export const r2StorageService = new R2StorageService();
