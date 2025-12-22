/**
 * API Route: Download Voter Excel Template
 *
 * Serves the voter-template.xlsx file for download
 */

import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';

export async function GET() {
  try {
    // Read the template file
    const filePath = path.join(process.cwd(), 'public', 'samples', 'voter-template.xlsx');
    const fileBuffer = await readFile(filePath);

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="voter-template.xlsx"',
      },
    });
  } catch (error) {
    console.error('Error serving voter template:', error);
    return NextResponse.json(
      { error: 'Failed to download template' },
      { status: 500 }
    );
  }
}
