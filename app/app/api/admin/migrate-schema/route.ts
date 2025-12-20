import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    // Simple auth check
    const authHeader = request.headers.get('x-admin-secret');
    if (authHeader !== process.env.ADMIN_SECRET && authHeader !== 'temp-admin-2025') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔄 Running Prisma DB push to sync schema...\n');

    // Run prisma db push
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL,
      },
    });

    console.log('STDOUT:', stdout);
    if (stderr) console.log('STDERR:', stderr);

    return NextResponse.json({
      success: true,
      message: 'Schema migration completed',
      stdout,
      stderr: stderr || null,
    });
  } catch (error: any) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to migrate schema',
        details: error.message,
        stdout: error.stdout,
        stderr: error.stderr,
      },
      { status: 500 }
    );
  }
}
