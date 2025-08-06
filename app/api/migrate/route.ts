import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/database/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { seed } from '@/lib/database/seed';

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with secret key
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (process.env.NODE_ENV === 'production' && secret !== process.env.MIGRATION_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting database migration...');

    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed');

    // Optionally seed database
    const shouldSeed = searchParams.get('seed') === 'true';
    if (shouldSeed) {
      console.log('🌱 Seeding database...');
      await seed();
      console.log('✅ Database seeded');
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      seeded: shouldSeed,
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint for status check
export async function GET() {
  return NextResponse.json({
    status: 'Migration endpoint ready',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
