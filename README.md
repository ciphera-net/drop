# Drop - Privacy-First File Sharing

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-green.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-blue.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Powered by Vercel](https://img.shields.io/badge/Powered%20by-Vercel-orange.svg?logo=vercel&logoColor=white)](https://vercel.com/)

Drop is a privacy-first file sharing application that encrypts files client-side before upload, ensuring that even the service provider cannot access user data.

## Features

- **End-to-End Encryption**: Files are encrypted client-side using AES-256-GCM.
- **Zero-Knowledge**: The server has no visibility into the file contents.
- **Secure Sharing**: Share files via secure links with optional password protection.
- **File Requests**: Create secure links to receive encrypted files from others.
- **Dashboard**: Manage your shared files and monitor downloads.
- **Configurable Expiration**: Set expiration times for shared files.
- **One-Time Downloads**: "Burn after reading" functionality for sensitive files.
- **Responsive Design**: Optimized for desktop and mobile devices.

## Architecture & Ecosystem

Drop is built on the **Ciphera** privacy platform, utilizing a microservices architecture to ensure separation of concerns and rigorous security boundaries:

- **Ciphera Auth**: A centralized identity management service that handles secure sessions, authentication, and OAuth flows.
- **Ciphera Relay**: A zero-knowledge storage relay service. It processes encrypted data blobs without ever having access to the encryption keys, ensuring true end-to-end privacy.
- **Drop Backend**: The core orchestrator for the Drop application, managing file metadata, expiration policies, and access controls.

This modular design ensures that cryptographic operations (Client) are strictly separated from identity (Auth) and persistence (Relay/Backend).

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Hosting**: Vercel
- **Infrastructure**: Railway (PostgreSQL), Cloudflare R2 (Storage)
- **Shared Packages**: `@ciphera-net/captcha` - Reusable captcha UI component from `ciphera-captcha`

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- Backend server running (see `drop-backend` repository)

### Installation

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Setup**:
    Copy the example environment file:
    ```bash
    cp .env.example .env.local
    ```
    
    Edit `.env.local` to set your backend API URLs:
    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:8080
    NEXT_PUBLIC_AUTH_URL=http://localhost:8081
    NEXT_PUBLIC_CAPTCHA_API_URL=http://localhost:8083/api/v1
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

    The application will be available at `http://localhost:3000`.

## Project Structure

```text
drop-frontend/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/              # Utilities, encryption, API client
├── styles/           # Global styles and Tailwind
└── public/           # Static assets
```

## Development Commands

- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.
- `npm run type-check`: Perform TypeScript type checking.

## Security

All encryption is performed client-side using the Web Crypto API. No plain-text file data is ever transmitted to the server. Refer to `docs/ENCRYPTION.md` for detailed specifications.

## License

AGPL-3.0
