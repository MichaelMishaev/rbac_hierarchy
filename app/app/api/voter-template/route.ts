/**
 * API Route: Download Voter Excel Template
 *
 * Serves the voter-template.xlsx file for download
 */

import { NextResponse } from 'next/server';
import path from 'path';
import { readFile } from 'fs/promises';
import { requireAuth } from '@/lib/api-auth';
import { withErrorHandler } from '@/lib/error-handler';

export const GET = withErrorHandler(async (request: Request) => {
  // ✅ SECURITY FIX (VULN-RBAC-001): Require authentication
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

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
});
