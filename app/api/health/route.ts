import { NextResponse } from 'next/server';
import { db } from '@/lib/database/config';
import { users } from '@/lib/database/schema';

export async function GET() {
  try {
    const startTime = Date.now();

    // Test database connection
    const dbTest = await db.select().from(users).limit(1);
    const dbResponseTime = Date.now() - startTime;

    // Check environment variables
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'STRIPE_SECRET_KEY',
      'GOOGLE_CLIENT_ID',
      'CLOUDINARY_CLOUD_NAME',
    ];

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    );

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: {
        connected: true,
        responseTime: `${dbResponseTime}ms`,
      },
      services: {
        stripe: !!process.env.STRIPE_SECRET_KEY,
        googleMaps: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
        email: !!process.env.EMAIL_SERVER_HOST,
      },
      environment_variables: {
        configured: requiredEnvVars.length - missingEnvVars.length,
        total: requiredEnvVars.length,
        missing: missingEnvVars,
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json(health);

  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
