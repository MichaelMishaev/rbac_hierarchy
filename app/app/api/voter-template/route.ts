/**
 * API Route: Download Voter Template
 * Serves the Excel template file with proper headers
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
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

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="Voter List Sample.xlsx"',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('[voter-template] Error serving template:', error);
    return NextResponse.json(
      { error: 'Failed to serve template file' },
      { status: 500 }
    );
  }
}
