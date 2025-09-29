'use client';

import { motion } from 'framer-motion';
import {
  Server,
  Container,
  Database,
  Shield,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Play,
} from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useState } from 'react';

export default function SelfHostedPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const codeExamples = {
    dockerfile: `# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \\
  elif [ -f package-lock.json ]; then npm ci; \\
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN \\
  if [ -f yarn.lock ]; then yarn build; \\
  elif [ -f package-lock.json ]; then npm run build; \\
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm build; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]`,

    dockerCompose: `# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://nextauth:password@postgres:5432/nextauth_db
      - NEXTAUTH_URL=https://yourdomain.com
      - NEXTAUTH_SECRET=\${NEXTAUTH_SECRET}
      - GOOGLE_CLIENT_ID=\${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=\${GOOGLE_CLIENT_SECRET}
      - GITHUB_ID=\${GITHUB_ID}
      - GITHUB_SECRET=\${GITHUB_SECRET}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=nextauth
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=nextauth_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge`,

    envFile: `# .env.production
# Application
NODE_ENV=production
PORT=3000

# NextAuth Configuration
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key-here

# Database
DATABASE_URL=postgresql://nextauth:password@postgres:5432/nextauth_db

# Redis (for session storage)
REDIS_URL=redis://:your-redis-password@redis:6379
REDIS_PASSWORD=your-redis-password

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# Email Provider (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# SSL/TLS Configuration
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/private.key`,

    nginxConfig: `# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream nextjs {
        server app:3000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/private.key;
        
        # SSL Settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security Headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";

        # Gzip Compression
        gzip on;
        gzip_vary on;
        gzip_min_length 10240;
        gzip_proxied expired no-cache no-store private must-revalidate auth;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Rate limiting for auth endpoints
        location /api/auth {
            limit_req zone=auth burst=10 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Rate limiting for API routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # All other requests
        location / {
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }

        # Static assets caching
        location /_next/static/ {
            proxy_pass http://nextjs;
            proxy_set_header Host $host;
            expires 365d;
            add_header Cache-Control "public, immutable";
        }

        # Health check endpoint
        location /health {
            proxy_pass http://nextjs;
            access_log off;
        }
    }
}`,

    initSql: `-- init.sql - Database initialization
CREATE DATABASE IF NOT EXISTS nextauth_db;

-- Create user if not exists
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles 
      WHERE  rolname = 'nextauth') THEN

      CREATE ROLE nextauth LOGIN PASSWORD 'password';
   END IF;
END
$do$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE nextauth_db TO nextauth;

-- Connect to the database
\\c nextauth_db;

-- NextAuth.js required tables
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL,
  "sessionToken" VARCHAR(255) NOT NULL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255),
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS accounts_provider_providerAccountId_key ON accounts(provider, "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS sessions_sessionToken_key ON sessions("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users(email);

-- Grant table permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO nextauth;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO nextauth;`,

    nextConfig: `// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Enable compression
  compress: true,
  
  // Optimization
  swcMinify: true,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },

  // Environment variables for production
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },

  // Image optimization
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Experimental features for better performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  }
}

module.exports = nextConfig`,

    healthCheck: `// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw\`SELECT 1\`
    
    // Check environment variables
    const requiredEnvVars = [
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'DATABASE_URL'
    ]

    const missingEnvVars = requiredEnvVars.filter(
      envVar => !process.env[envVar]
    )

    if (missingEnvVars.length > 0) {
      return NextResponse.json(
        { 
          status: 'unhealthy', 
          error: \`Missing environment variables: \${missingEnvVars.join(', ')}\`
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      nextauth: 'configured'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: 'Database connection failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}`,

    deployScript: `#!/bin/bash
# deploy.sh - Production deployment script

set -e  # Exit on any error

echo "🚀 Starting deployment..."

# Configuration
DOMAIN="yourdomain.com"
APP_NAME="nextauth-app"
BACKUP_DIR="/backups"
COMPOSE_FILE="docker-compose.yml"

# Create backup
echo "📦 Creating database backup..."
mkdir -p $BACKUP_DIR
docker-compose exec -T postgres pg_dump -U nextauth nextauth_db > "$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build and deploy
echo "🏗️  Building application..."
docker-compose build --no-cache

echo "🔄 Updating services..."
docker-compose down --remove-orphans
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Health check
echo "🏥 Performing health check..."
if curl -f -s "https://$DOMAIN/api/health" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
    echo "🔄 Rolling back..."
    docker-compose down
    # Restore from backup if needed
    exit 1
fi

# Cleanup old images
echo "🧹 Cleaning up old Docker images..."
docker image prune -f

echo "🎉 Deployment completed successfully!"
echo "🌐 Application is running at: https://$DOMAIN"`,

    monitoringConfig: `# monitoring.yml - Docker Compose monitoring stack
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge`,

    backupScript: `#!/bin/bash
# backup.sh - Automated backup script

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
DB_BACKUP="$BACKUP_DIR/db_backup_$DATE.sql"
ENV_BACKUP="$BACKUP_DIR/env_backup_$DATE.tar.gz"

echo "🗄️  Starting backup process..."

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "💾 Backing up database..."
docker-compose exec -T postgres pg_dump -U nextauth nextauth_db > "$DB_BACKUP"
gzip "$DB_BACKUP"

# Environment and configuration backup
echo "⚙️  Backing up configuration..."
tar -czf "$ENV_BACKUP" .env docker-compose.yml nginx.conf

# Upload to cloud storage (example with AWS S3)
if command -v aws &> /dev/null; then
    echo "☁️  Uploading to S3..."
    aws s3 cp "$DB_BACKUP.gz" "s3://your-backup-bucket/database/"
    aws s3 cp "$ENV_BACKUP" "s3://your-backup-bucket/config/"
fi

# Cleanup old backups
echo "🧹 Cleaning up old backups..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed successfully!"`,

    systemdService: `# /etc/systemd/system/nextauth-app.service
[Unit]
Description=NextAuth Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/nextauth-app
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target`,
  };

  const requirements = [
    { title: 'Docker', version: '20.10+', description: 'Container runtime' },
    { title: 'Docker Compose', version: '2.0+', description: 'Container orchestration' },
    { title: 'Node.js', version: '18+', description: 'JavaScript runtime (for local development)' },
    { title: 'PostgreSQL', version: '13+', description: 'Database server (or use Docker)' },
    { title: 'Nginx', version: '1.18+', description: 'Reverse proxy (or use Docker)' },
    {
      title: 'SSL Certificate',
      version: 'Valid',
      description: "For HTTPS (Let's Encrypt recommended)",
    },
  ];

  const deploymentSteps = [
    { title: 'Prerequisites', description: 'Install required software' },
    { title: 'Configuration', description: 'Set up environment variables' },
    { title: 'Database Setup', description: 'Initialize PostgreSQL' },
    { title: 'SSL Configuration', description: 'Configure HTTPS' },
    { title: 'Docker Build', description: 'Build and run containers' },
    { title: 'Monitoring', description: 'Set up health checks' },
    { title: 'Production', description: 'Go live and monitor' },
  ];

  const securityConsiderations = [
    {
      title: 'Environment Variables',
      description: 'Never commit sensitive environment variables to version control',
      solution: 'Use Docker secrets or encrypted environment files',
    },
    {
      title: 'Database Security',
      description: 'Secure database connections and use strong passwords',
      solution: 'Use SSL/TLS for database connections and regularly rotate credentials',
    },
    {
      title: 'Reverse Proxy',
      description: 'Configure Nginx with proper security headers and rate limiting',
      solution: 'Implement OWASP security headers and DDoS protection',
    },
    {
      title: 'SSL/TLS',
      description: 'Ensure all traffic is encrypted in transit',
      solution: "Use Let's Encrypt or proper SSL certificates with strong ciphers",
    },
    {
      title: 'Container Security',
      description: 'Keep Docker images updated and scan for vulnerabilities',
      solution: 'Use multi-stage builds and regularly update base images',
    },
  ];

  return (
    <div className='px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto'>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-8'>
        <div className='flex items-center gap-3 mb-4'>
          <div className='p-3 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl'>
            <Server className='w-6 h-6 text-white' />
          </div>
          <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
            Self-Hosted Deployment
          </h1>
        </div>
        <p className='text-lg text-slate-600 dark:text-slate-400'>
          Deploy @airauth/next on your own infrastructure with Docker, complete with database, SSL,
          and monitoring.
        </p>
      </motion.div>

      {/* Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Deployment Options
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-800 rounded-lg'>
            <Container className='w-8 h-8 text-blue-600 dark:text-blue-400 mb-2' />
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-1'>Docker Compose</h3>
            <p className='text-sm text-blue-800 dark:text-blue-300'>
              Full stack with database and reverse proxy
            </p>
          </div>
          <div className='p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg'>
            <Database className='w-8 h-8 text-green-600 dark:text-green-400 mb-2' />
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-1'>
              Production Ready
            </h3>
            <p className='text-sm text-green-800 dark:text-green-300'>
              PostgreSQL, Redis, SSL, and monitoring
            </p>
          </div>
          <div className='p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-lg'>
            <Shield className='w-8 h-8 text-purple-600 dark:text-purple-400 mb-2' />
            <h3 className='font-semibold text-purple-900 dark:text-purple-400 mb-1'>
              Secure by Default
            </h3>
            <p className='text-sm text-purple-800 dark:text-purple-300'>
              Rate limiting, HTTPS, and security headers
            </p>
          </div>
        </div>
      </motion.section>

      {/* Requirements */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          System Requirements
        </h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {requirements.map((req, index) => (
            <div
              key={index}
              className='flex items-center p-4 bg-slate-100 dark:bg-slate-800 rounded-lg'
            >
              <CheckCircle className='w-5 h-5 text-green-600 mr-3 flex-shrink-0' />
              <div>
                <h3 className='font-semibold text-slate-900 dark:text-white'>
                  {req.title} {req.version}
                </h3>
                <p className='text-sm text-slate-600 dark:text-slate-400'>{req.description}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Deployment Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-6'>
          Deployment Guide
        </h2>

        {/* Progress Steps */}
        <div className='flex items-center justify-between mb-20 relative overflow-hidden'>
          <div className='absolute left-0 right-0 top-5 h-0.5 bg-slate-200 dark:bg-slate-700' />
          {deploymentSteps.map((step, index) => (
            <div key={index} className='relative flex flex-col items-center'>
              <div className='w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold z-10'>
                {index + 1}
              </div>
              <span className='hidden sm:block absolute top-12 text-xs text-slate-600 dark:text-slate-400 text-center w-20'>
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Step 1: Dockerfile */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 1: Create Dockerfile
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Create a production-ready Dockerfile with multi-stage builds for optimal image size:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.dockerfile, 'dockerfile')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'dockerfile' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='dockerfile' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.dockerfile}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 2: Docker Compose */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 2: Configure Docker Compose
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Set up the complete infrastructure stack with database, cache, and reverse proxy:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.dockerCompose, 'compose')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'compose' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='yaml' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.dockerCompose}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 3: Environment Variables */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 3: Environment Configuration
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Create a comprehensive environment file for production:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.envFile, 'env')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'env' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.envFile}
            </SyntaxHighlighter>
          </div>
          <div className='mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg'>
            <div className='flex items-start gap-2'>
              <AlertTriangle className='w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5' />
              <div className='text-sm'>
                <p className='font-semibold text-amber-900 dark:text-amber-400 mb-1'>
                  Security Note
                </p>
                <p className='text-amber-800 dark:text-amber-300'>
                  Generate strong secrets using:{' '}
                  <code className='px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded'>
                    openssl rand -base64 32
                  </code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Database Initialization */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 4: Database Setup
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Initialize the PostgreSQL database with NextAuth.js tables:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.initSql, 'init-sql')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'init-sql' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='sql' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.initSql}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 5: Nginx Configuration */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 5: Nginx Reverse Proxy
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Configure Nginx with SSL, security headers, and rate limiting:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.nginxConfig, 'nginx')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'nginx' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='nginx' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.nginxConfig}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 6: Next.js Configuration */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 6: Next.js Production Config
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Optimize Next.js for production deployment:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.nextConfig, 'next-config')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'next-config' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='javascript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.nextConfig}
            </SyntaxHighlighter>
          </div>
        </div>

        {/* Step 7: Health Check */}
        <div className='mb-8'>
          <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
            Step 7: Health Check Endpoint
          </h3>
          <p className='text-sm text-slate-600 dark:text-slate-400 mb-3'>
            Create a health check endpoint for monitoring:
          </p>
          <div className='relative'>
            <button
              onClick={() => copyCode(codeExamples.healthCheck, 'health')}
              className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
            >
              {copiedCode === 'health' ? (
                <Check className='w-4 h-4 text-green-400' />
              ) : (
                <Copy className='w-4 h-4 text-slate-400' />
              )}
            </button>
            <SyntaxHighlighter language='typescript' style={vscDarkPlus} className='rounded-lg'>
              {codeExamples.healthCheck}
            </SyntaxHighlighter>
          </div>
        </div>
      </motion.section>

      {/* Deployment Commands */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Deployment Commands
        </h2>
        <div className='space-y-4'>
          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-4'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2'>
              <Play className='w-4 h-4' />
              Initial Setup
            </h3>
            <div className='space-y-2'>
              <div className='relative'>
                <button
                  onClick={() =>
                    copyCode(
                      '# Clone your repository\ngit clone https://github.com/n10l/airauth.git\ncd airauth',
                      'setup1'
                    )
                  }
                  className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
                >
                  {copiedCode === 'setup1' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded text-sm'>
                  {`# Clone your repository
git clone https://github.com/n10l/airauth.git
cd airauth`}
                </SyntaxHighlighter>
              </div>
              <div className='relative'>
                <button
                  onClick={() =>
                    copyCode(
                      '# Copy environment file and configure\ncp .env.example .env.production\n# Edit .env.production with your settings',
                      'setup2'
                    )
                  }
                  className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
                >
                  {copiedCode === 'setup2' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded text-sm'>
                  {`# Copy environment file and configure
cp .env.example .env.production
# Edit .env.production with your settings`}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>

          <div className='bg-slate-100 dark:bg-slate-800 rounded-lg p-4'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2'>
              <Container className='w-4 h-4' />
              Docker Commands
            </h3>
            <div className='space-y-2'>
              <div className='relative'>
                <button
                  onClick={() =>
                    copyCode('# Build and start services\ndocker-compose up -d --build', 'docker1')
                  }
                  className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
                >
                  {copiedCode === 'docker1' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded text-sm'>
                  {`# Build and start services
docker-compose up -d --build`}
                </SyntaxHighlighter>
              </div>
              <div className='relative'>
                <button
                  onClick={() =>
                    copyCode(
                      '# Check service status\ndocker-compose ps\n\n# View logs\ndocker-compose logs -f app',
                      'docker2'
                    )
                  }
                  className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
                >
                  {copiedCode === 'docker2' ? (
                    <Check className='w-3.5 h-3.5 text-green-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5 text-slate-400' />
                  )}
                </button>
                <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded text-sm'>
                  {`# Check service status
docker-compose ps

# View logs
docker-compose logs -f app`}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* SSL Setup */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          SSL/TLS Configuration
        </h2>
        <div className='space-y-4'>
          <div className='bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6'>
            <h3 className='font-semibold text-green-900 dark:text-green-400 mb-2 flex items-center gap-2'>
              <Shield className='w-5 h-5' />
              Let's Encrypt (Recommended)
            </h3>
            <p className='text-green-800 dark:text-green-300 mb-3'>
              Free SSL certificates with automatic renewal:
            </p>
            <div className='relative'>
              <button
                onClick={() =>
                  copyCode(
                    '# Install Certbot\nsudo apt install certbot python3-certbot-nginx\n\n# Get certificate\nsudo certbot --nginx -d yourdomain.com -d www.yourdomain.com\n\n# Test renewal\nsudo certbot renew --dry-run',
                    'ssl-certbot'
                  )
                }
                className='absolute right-2 top-2 p-1.5 bg-green-700 hover:bg-green-600 rounded transition-colors z-10'
              >
                {copiedCode === 'ssl-certbot' ? (
                  <Check className='w-3.5 h-3.5 text-green-100' />
                ) : (
                  <Copy className='w-3.5 h-3.5 text-green-100' />
                )}
              </button>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded text-sm'>
                {`# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test renewal
sudo certbot renew --dry-run`}
              </SyntaxHighlighter>
            </div>
          </div>

          <div className='bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6'>
            <h3 className='font-semibold text-slate-900 dark:text-white mb-2'>
              Custom SSL Certificate
            </h3>
            <p className='text-slate-600 dark:text-slate-400 mb-3'>
              If using a custom certificate, place files in the ssl directory:
            </p>
            <div className='relative'>
              <button
                onClick={() =>
                  copyCode(
                    '# Create SSL directory\nmkdir -p ./ssl\n\n# Copy your certificate files\ncp /path/to/your/cert.pem ./ssl/cert.pem\ncp /path/to/your/private.key ./ssl/private.key\n\n# Set proper permissions\nchmod 600 ./ssl/private.key\nchmod 644 ./ssl/cert.pem',
                    'ssl-custom'
                  )
                }
                className='absolute right-2 top-2 p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition-colors z-10'
              >
                {copiedCode === 'ssl-custom' ? (
                  <Check className='w-3.5 h-3.5 text-green-400' />
                ) : (
                  <Copy className='w-3.5 h-3.5 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded text-sm'>
                {`# Create SSL directory
mkdir -p ./ssl

# Copy your certificate files
cp /path/to/your/cert.pem ./ssl/cert.pem
cp /path/to/your/private.key ./ssl/private.key

# Set proper permissions
chmod 600 ./ssl/private.key
chmod 644 ./ssl/cert.pem`}
              </SyntaxHighlighter>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Security Considerations */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Security Considerations
        </h2>
        <div className='space-y-4'>
          {securityConsiderations.map((item, index) => (
            <div
              key={index}
              className='border border-slate-200 dark:border-slate-700 rounded-lg p-4'
            >
              <h3 className='font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2'>
                <Shield className='w-4 h-4 text-orange-600' />
                {item.title}
              </h3>
              <p className='text-slate-600 dark:text-slate-400 mb-2'>{item.description}</p>
              <p className='text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded'>
                <strong>Solution:</strong> {item.solution}
              </p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Monitoring & Automation */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Monitoring & Automation
        </h2>

        <div className='space-y-6'>
          {/* Deployment Script */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Automated Deployment Script
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.deployScript, 'deploy-script')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'deploy-script' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.deployScript}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Backup Script */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Backup Automation
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.backupScript, 'backup-script')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'backup-script' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='bash' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.backupScript}
              </SyntaxHighlighter>
            </div>
          </div>

          {/* Systemd Service */}
          <div>
            <h3 className='text-lg font-semibold text-slate-900 dark:text-white mb-3'>
              Systemd Service (Auto-start)
            </h3>
            <div className='relative'>
              <button
                onClick={() => copyCode(codeExamples.systemdService, 'systemd')}
                className='absolute right-2 top-2 p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors z-10'
              >
                {copiedCode === 'systemd' ? (
                  <Check className='w-4 h-4 text-green-400' />
                ) : (
                  <Copy className='w-4 h-4 text-slate-400' />
                )}
              </button>
              <SyntaxHighlighter language='ini' style={vscDarkPlus} className='rounded-lg'>
                {codeExamples.systemdService}
              </SyntaxHighlighter>
            </div>
            <p className='text-sm text-slate-600 dark:text-slate-400 mt-2'>
              After creating the service file, enable it with:{' '}
              <code className='px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded'>
                sudo systemctl enable nextauth-app
              </code>
            </p>
          </div>
        </div>
      </motion.section>

      {/* Troubleshooting */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>
          Troubleshooting
        </h2>
        <div className='space-y-4'>
          <div className='bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4'>
            <h3 className='font-semibold text-yellow-900 dark:text-yellow-400 mb-2'>
              Container Won't Start
            </h3>
            <ul className='text-sm text-yellow-800 dark:text-yellow-300 space-y-1'>
              <li>
                • Check logs: <code>docker-compose logs app</code>
              </li>
              <li>• Verify environment variables are set correctly</li>
              <li>• Ensure ports 3000, 5432, and 6379 are available</li>
              <li>
                • Check Docker disk space: <code>docker system df</code>
              </li>
            </ul>
          </div>

          <div className='bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'>
            <h3 className='font-semibold text-red-900 dark:text-red-400 mb-2'>
              Database Connection Issues
            </h3>
            <ul className='text-sm text-red-800 dark:text-red-300 space-y-1'>
              <li>• Verify DATABASE_URL format is correct</li>
              <li>
                • Check if PostgreSQL container is running: <code>docker-compose ps postgres</code>
              </li>
              <li>
                • Test database connection:{' '}
                <code>docker-compose exec postgres psql -U nextauth -d nextauth_db</code>
              </li>
              <li>• Check database initialization logs</li>
            </ul>
          </div>

          <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'>
            <h3 className='font-semibold text-blue-900 dark:text-blue-400 mb-2'>
              SSL Certificate Issues
            </h3>
            <ul className='text-sm text-blue-800 dark:text-blue-300 space-y-1'>
              <li>• Verify certificate files exist in ./ssl directory</li>
              <li>
                • Check certificate expiration:{' '}
                <code>openssl x509 -in ./ssl/cert.pem -text -noout</code>
              </li>
              <li>
                • Test SSL configuration: <code>curl -I https://yourdomain.com</code>
              </li>
              <li>
                • For Let's Encrypt: <code>sudo certbot certificates</code>
              </li>
            </ul>
          </div>
        </div>
      </motion.section>

      {/* Next Steps */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className='mb-12'
      >
        <h2 className='text-2xl font-semibold text-slate-900 dark:text-white mb-4'>Next Steps</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <a
            href='/docs/configuration'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Advanced Configuration</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Configure providers and callbacks
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/monitoring'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Monitoring Setup</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Prometheus, Grafana, and alerting
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/scaling'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Scaling Guide</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Load balancing and high availability
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
          <a
            href='/docs/backup-recovery'
            className='flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors'
          >
            <div>
              <h3 className='font-medium text-slate-900 dark:text-white'>Backup & Recovery</h3>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                Data protection strategies
              </p>
            </div>
            <ArrowRight className='w-5 h-5 text-slate-400' />
          </a>
        </div>
      </motion.section>
    </div>
  );
}
