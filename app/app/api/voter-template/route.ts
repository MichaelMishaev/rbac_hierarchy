/**
 * API Route: Download Voter Template
 * Serves the Excel template file with proper headers
 * Note: Public endpoint - no authentication required for template download
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { withErrorHandler } from '@/lib/error-handler';
import { logger, extractRequestContext } from '@/lib/logger';

export const GET = withErrorHandler(async (request: Request) => {
  try {
    // Log template download (public endpoint)
    const context = await extractRequestContext(request);
    logger.info('Voter template download requested', context);

    // Path to template file
    const filePath = path.join(process.cwd(), 'public', 'samples', 'voter-template.xlsx');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Template file not found' },
        { status: 404 }
      );
    }

    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);

    // Return file with proper headers (no cache to always serve latest template)
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Voter List Sample.xlsx"',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('[voter-template] Error serving template:', error);
    return NextResponse.json(
      { error: 'Failed to serve template file' },
      { status: 500 }
    );
  }
});
