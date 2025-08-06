import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

// Database configuration for different environments
const config = {
  development: {
    connectionString: process.env.DATABASE_URL!,
    max: 5, // Max connections for development
    ssl: false,
  },
  production: {
    connectionString: process.env.DATABASE_URL!,
    max: 20, // Max connections for production
    ssl: { rejectUnauthorized: false },
    idle_timeout: 20,
    connect_timeout: 10,
  },
  test: {
    connectionString: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL!,
    max: 2,
    ssl: false,
  }
};

const env = process.env.NODE_ENV as keyof typeof config || 'development';
const dbConfig = config[env];

// Create connection pool
let connectionPool: postgres.Sql;

if (env === 'production') {
  // Production connection with optimizations
  connectionPool = postgres(dbConfig.connectionString, {
    max: dbConfig.max,
    ssl: dbConfig.ssl,
    idle_timeout: dbConfig.idle_timeout,
    connect_timeout: dbConfig.connect_timeout,
    // Prepared statements cache
    prepare: true,
    // Enable connection pooling
    connection: {
      application_name: 'meet2rent',
    },
    // Transform for better performance
    transform: {
      undefined: null,
    },
    // Debug in development only
    debug: false,
    // Connection retry logic
    connection: {
      ...dbConfig.ssl && { ssl: dbConfig.ssl },
    },
  });
} else {
  // Development connection
  connectionPool = postgres(dbConfig.connectionString, {
    max: dbConfig.max,
    ssl: dbConfig.ssl,
    debug: env === 'development',
    prepare: true,
  });
}

// Create Drizzle instance
export const db = drizzle(connectionPool, {
  schema,
  logger: env === 'development'
});

// Health check function
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  latency: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await connectionPool`SELECT 1 as health_check`;
    const latency = Date.now() - start;

    return {
      status: 'healthy',
      latency,
    };
  } catch (error) {
    const latency = Date.now() - start;

    return {
      status: 'unhealthy',
      latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Connection pool statistics
export async function getConnectionStats() {
  return {
    totalConnections: connectionPool.options.max,
    activeConnections: connectionPool.options.max - connectionPool.options.idle_timeout,
    idleConnections: connectionPool.options.idle_timeout,
  };
}

// Migration runner for production
export async function runMigrations() {
  if (env === 'production') {
    console.log('Running database migrations...');

    try {
      await migrate(db, {
        migrationsFolder: './migrations',
        migrationsTable: 'drizzle_migrations'
      });

      console.log('✅ Database migrations completed successfully');
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  try {
    await connectionPool.end();
    console.log('✅ Database connection closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
}

// Database monitoring and alerting
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private healthCheckInterval?: NodeJS.Timeout;
  private lastHealthCheck: Date = new Date();
  private consecutiveFailures: number = 0;

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  startMonitoring(intervalMs: number = 60000) { // Check every minute
    if (env !== 'production') return;

    this.healthCheckInterval = setInterval(async () => {
      const health = await checkDatabaseHealth();
      this.lastHealthCheck = new Date();

      if (health.status === 'unhealthy') {
        this.consecutiveFailures++;
        console.error(`Database health check failed (${this.consecutiveFailures} consecutive failures):`, health.error);

        // Alert after 3 consecutive failures
        if (this.consecutiveFailures >= 3) {
          this.alertDatabaseIssue(health);
        }
      } else {
        if (this.consecutiveFailures > 0) {
          console.log('✅ Database health restored');
        }
        this.consecutiveFailures = 0;
      }

      // Log slow responses
      if (health.latency > 1000) {
        console.warn(`Slow database response: ${health.latency}ms`);
      }
    }, intervalMs);
  }

  stopMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  private async alertDatabaseIssue(health: { status: string; latency: number; error?: string }) {
    // In production, this would send alerts to monitoring services
    console.error('🚨 CRITICAL: Database connection issues detected', {
      consecutiveFailures: this.consecutiveFailures,
      lastHealthCheck: this.lastHealthCheck,
      latency: health.latency,
      error: health.error,
    });

    // TODO: Send to Sentry, Slack, email, etc.
    // await sendAlert('database-critical', health);
  }

  getStatus() {
    return {
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      isMonitoring: !!this.healthCheckInterval,
    };
  }
}

// Database transaction helper with retry logic
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await db.transaction(callback);
      return result;
    } catch (error) {
      lastError = error as Error;

      console.warn(`Transaction attempt ${attempt} failed:`, error);

      if (attempt === maxRetries) {
        console.error('Transaction failed after all retries:', error);
        throw lastError;
      }

      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  throw lastError!;
}

// Query performance tracking
export function trackQuery<T>(queryName: string) {
  return function(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      const start = Date.now();

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;

        // Log slow queries
        if (duration > 500) {
          console.warn(`Slow query "${queryName}": ${duration}ms`);
        }

        // Track in development
        if (env === 'development') {
          console.log(`Query "${queryName}": ${duration}ms`);
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        console.error(`Query "${queryName}" failed after ${duration}ms:`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

// Export connection for direct usage if needed
export { connectionPool };

// Initialize monitoring in production
if (env === 'production') {
  const monitor = DatabaseMonitor.getInstance();
  monitor.startMonitoring();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    monitor.stopMonitoring();
    await closeDatabaseConnection();
  });

  process.on('SIGINT', async () => {
    monitor.stopMonitoring();
    await closeDatabaseConnection();
  });
}
