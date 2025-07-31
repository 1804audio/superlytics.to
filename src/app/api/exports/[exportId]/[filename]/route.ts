import { NextRequest, NextResponse } from 'next/server';
import { dataExportService } from '@/lib/services/data-export-service';
import { notFound } from '@/lib/response';
import debug from 'debug';

const log = debug('superlytics:export-download');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exportId: string; filename: string }> },
) {
  try {
    const { exportId, filename } = await params;

    log(`Download request for export ${exportId}, file ${filename}`);

    // Check if export exists
    if (!(await dataExportService.exportExists(exportId))) {
      log(`Export ${exportId} not found or expired`);
      return notFound('Export not found or has expired');
    }

    // Get the file
    const file = await dataExportService.getExportFile(exportId, decodeURIComponent(filename));

    if (!file) {
      log(`File ${filename} not found in export ${exportId}`);
      return notFound('File not found in export');
    }

    log(`Serving file ${filename} (${file.size})`);

    // Create response with file content
    const response = new NextResponse(file.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${file.filename}"`,
        'Content-Length': file.content.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });

    return response;
  } catch (error) {
    log('Download error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
