# Ciphera Infrastructure

This document outlines the infrastructure components and deployment architecture for the Ciphera ecosystem.

## Overview

Ciphera follows a microservices architecture with a strict separation between Authentication (Identity) and Application Logic (File Sharing).

### Components

| Service | Technology | Hosting | Purpose |
| :--- | :--- | :--- | :--- |
| **Ciphera Auth** | Go (Gin) | Railway | Identity Provider, OAuth2, JWT Issuance |
| **Auth Frontend** | Next.js (React) | Railway | Authentication UI, Login/Signup flows |
| **Drop Backend** | Go (Gin) | Railway | File Metadata, Upload/Download orchestration |
| **Drop Frontend** | Next.js (React) | Railway | User Interface, Client-side Encryption |
| **Pulse Backend** | Go (Gin) | Railway | Pulse event ingestion and queries |
| **Pulse Frontend** | Next.js (React) | Railway | Pulse dashboard interface |
| **Ciphera Captcha** | Go (Gin) | Railway | Bot Protection, PoW/Visual Captcha Verification |
| **Website** | Next.js (React) | Railway | Marketing website |
| **Ciphera Relay** | Stalwart Mail | Infomaniak Public Cloud | Transactional Email Delivery (SMTP) |
| **Database** | PostgreSQL | Railway | Relational Data (Users, Metadata) |
| **Storage** | Cloudflare R2 | Cloudflare | Encrypted File Blobs (S3 Compatible) |

## Deployment Strategy

### Authentication Service (`ciphera-auth`)
- **Repo**: `ciphera-drop/ciphera-auth`
- **Env Vars**:
  - `DATABASE_URL`: Connection to Railway Postgres.
  - `JWT_SECRET`: Signing key for tokens (shared with Backend).
  - `SMTP_HOST`: `relay.ciphera.net`
  - `SMTP_USER`: `noreply@ciphera.net`
  - `SMTP_PASS`: (Secret)
  - `FRONTEND_URL`: `https://drop.ciphera.net`

### Captcha Service (`ciphera-captcha`)
- **Repo**: `ciphera-drop/ciphera-captcha`
- **Env Vars**:
  - `PORT`: `8082` (default)
  - `JWT_SECRET`: Secret key for signing captcha tokens (shared with backend services)
  - `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
  - `CAPTCHA_LENGTH`: Number of characters in visual captcha (default: 6)
  - `CAPTCHA_EXPIRATION_MINUTES`: Token validity duration (default: 10)
- **UI Package**: `@ciphera-net/captcha` - Reusable React component for all Ciphera apps

### Mail Server (`ciphera-relay`)
- **Repo**: `ciphera-relay` (Separate Repo)
- **Software**: Stalwart Mail Server (Docker).
- **Location**: Infomaniak (Switzerland).
- **IP Address**: Static IPv4.
- **Ports**: 
  - `25` (SMTP Inbound/Outbound)
  - `587` (Submission + STARTTLS)
  - `465` (SMTPS)
  - `993` (IMAPS)
  - `8081` (Admin UI - Exposed to Docker Network)
- **Security**:
  - Admin UI bound to `0.0.0.0:8081` (Protected by Nginx Proxy Manager).
  - SPF/DKIM/DMARC configured in Cloudflare DNS.
  - Reverse DNS (PTR) set to `relay.ciphera.net`.

### Application Backend (`drop-backend`)
- **Repo**: `ciphera-drop/drop-backend`
- **Env Vars**:
  - `DATABASE_URL`: Same Postgres instance (different schema or logic separation).
  - `JWT_SECRET`: Verification key for tokens.
  - `R2_ACCESS_KEY`: Cloudflare Storage Key.
  - `R2_SECRET_KEY`: Cloudflare Storage Secret.

### Application Frontend (`drop-frontend`)
- **Repo**: `ciphera-drop/drop-frontend`
- **Env Vars**:
  - `NEXT_PUBLIC_API_URL`: `https://drop-api.ciphera.net`
  - `NEXT_PUBLIC_AUTH_URL`: `https://auth.ciphera.net`
  - `NEXT_PUBLIC_CAPTCHA_API_URL`: `https://captcha.ciphera.net/api/v1`
- **Dependencies**:
  - `@ciphera-net/captcha`: Shared captcha UI component from `ciphera-captcha/ui`

### Auth Frontend (`auth-frontend`)
- **Repo**: `ciphera-drop/auth-frontend`
- **Env Vars**:
  - `NEXT_PUBLIC_AUTH_API_URL`: `https://auth.ciphera.net`
  - `NEXT_PUBLIC_APP_URL`: `https://auth.ciphera.net`

### Pulse Backend (`pulse-backend`)
- **Repo**: `ciphera-drop/pulse-backend`
- **Env Vars**:
  - `DATABASE_URL`: Connection to Railway Postgres
  - `JWT_SECRET`: Shared secret with ciphera-auth
  - `CORS_ORIGIN`: Allowed CORS origins (comma-separated)
  - `PORT`: Server port (default: 8082)

### Pulse Frontend (`pulse`)
- **Repo**: `ciphera-drop/pulse`
- **Env Vars**:
  - `NEXT_PUBLIC_API_URL`: `https://pulse-api.ciphera.net`
  - `NEXT_PUBLIC_AUTH_URL`: `https://auth.ciphera.net`
  - `NEXT_PUBLIC_AUTH_API_URL`: `https://auth.ciphera.net`
  - `NEXT_PUBLIC_APP_URL`: `https://pulse.ciphera.net`

### Website (`website`)
- **Repo**: `ciphera-drop/website`
- **Env Vars**:
  - Environment variables as needed for the marketing site

## Monitoring & Maintenance

### Logs
- **Apps**: Railway Dashboard Logs.
- **Mail**: `ssh root@relay.ciphera.net "docker logs -f ciphera-mail"`

### Database Backups
- Handled automatically by Railway.

### Mail Server Updates
1. SSH into VPS.
2. `cd ciphera-relay`
3. `docker compose pull`
4. `docker compose up -d`
