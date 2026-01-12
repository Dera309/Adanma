# Adanma - African E-commerce Platform

A full-stack e-commerce platform designed for African markets, supporting users across Nigeria, Ghana, Kenya, South Africa, Cameroon, and Egypt.

## Project Structure

```
adanma/
├── backend/          # Node.js + Express + TypeScript backend
├── frontend/         # React + TypeScript frontend
├── .kiro/           # Kiro specs and configuration
└── package.json     # Root package.json for monorepo
```

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account (or local MongoDB >= 5.0)

## Getting Started

### Quick Start (Windows)

**Easiest way to get started:**

1. Double-click `check-status.bat` to verify your system
2. Double-click `setup.bat` to install dependencies
3. Update MongoDB password in `backend/.env`
4. Double-click `start-backend.bat` to start backend
5. Double-click `start-frontend.bat` to start frontend
6. Open http://localhost:3000 in your browser

📖 **See [QUICK-START.md](./QUICK-START.md) for detailed instructions**

### Manual Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`
   - Update `DATABASE_URL` in `backend/.env` with your MongoDB Atlas connection string
   - Update other values with your configuration

### Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
npm run dev:frontend  # Frontend on http://localhost:3000
npm run dev:backend   # Backend on http://localhost:5000
```

### Building

Build both frontend and backend:
```bash
npm run build
```

### Linting

Run ESLint on both projects:
```bash
npm run lint
```

### Formatting

Format code with Prettier:
```bash
npm run format
```

Check formatting:
```bash
npm run format:check
```

## Technology Stack

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB with Prisma ORM
- JWT authentication
- Passport.js for OAuth

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios

## Features

- Multi-method authentication (Email, Phone, WhatsApp, Facebook)
- Dual user roles (Buyer and Vendor)
- Country-specific address management for 6 African countries
- Vendor verification system
- Session management
- Password reset functionality

## Documentation

See the `.kiro/specs/african-ecommerce-webapp/` directory for:
- Requirements document
- Design document
- Implementation tasks

## Deployment

For production deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

Quick deployment:
```bash
# On your production server
git clone <repo-url>
cd african-ecommerce
cp .env.production.example .env.production
# Edit .env.production with your values
chmod +x scripts/*.sh
./scripts/deploy.sh
```

## License

Proprietary
"# Adanma" 
