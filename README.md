# Drop - Privacy-First File Sharing

Drop is a privacy-first file sharing application that encrypts files client-side before upload, ensuring that even the service provider cannot access user data.

## Features

- 🔒 **End-to-End Encryption**: Files encrypted client-side using AES-256-GCM
- 🚫 **Zero-Knowledge**: We cannot see what you upload
- 🔗 **Secure Sharing**: Share files via secure links with optional password protection
- ⏱️ **Configurable Expiration**: Set expiration times for shared files
- 📱 **Responsive Design**: Works on all devices

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

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local and set your backend API URL
# NEXT_PUBLIC_API_URL=http://localhost:8080

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
drop-frontend/
├── app/              # Next.js App Router pages
├── components/       # React components
├── lib/             # Utilities, encryption, API client
├── styles/          # Global styles and Tailwind
└── public/          # Static assets
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run type-check` - Type check without building

## Security

All encryption happens client-side. See `docs/ENCRYPTION.md` for details.

## License

AGPL-3.0 or similar (to be determined)
