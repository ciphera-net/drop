# Drop - Privacy-First File Sharing

Drop is a privacy-first file sharing application that encrypts files client-side before upload, ensuring that even the service provider cannot access user data.

## Features

- **End-to-End Encryption**: Files are encrypted client-side using AES-256-GCM.
- **Zero-Knowledge**: The server has no visibility into the file contents.
- **Secure Sharing**: Share files via secure links with optional password protection.
- **Configurable Expiration**: Set expiration times for shared files.
- **Responsive Design**: Optimized for desktop and mobile devices.

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Encryption**: Web Crypto API (AES-256-GCM)
- **Hosting**: Vercel

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
    
    Edit `.env.local` to set your backend API URL:
    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:8080
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
