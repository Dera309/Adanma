# Adanma - African E-commerce Platform

Adanma is a modern, full-stack e-commerce platform tailored for the African market. It features a robust multi-method authentication system, role-based access control, and a scalable architecture designed to handle diverse regional requirements.

## 🚀 Features

- **Multi-Method Authentication**: Support for Email and Phone Number based login/registration.
- **Role-Based Access Control**: Distinct flows for Buyers and Vendors.
- **Vendor Verification System**: Comprehensive KYC and business verification for sellers.
- **Regional Address Management**: Support for state/LGA (Nigeria), region/district (Ghana), county (Kenya), and more.
- **Advanced Cart System**: Real-time cart management with backend synchronization.
- **Robust API**: Type-safe REST API built with Node.js and TypeScript.
- **Database Fallback**: Automated fallback to Mock/In-memory storage when MongoDB Atlas is unreachable.

## 🛠️ Technology Stack

- **Frontend**: React, Vite, Axios, TypeScript, Vanilla CSS.
- **Backend**: Node.js, Express, MongoDB, JWT, TypeScript.
- **DevOps**: Docker, Docker Compose, Nginx.

## 🏁 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas account (optional, fallback included)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Dera309/Adanma.git
   cd Adanma
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   cd backend && npm install
   
   # Frontend
   cd ../frontend && npm install
   ```

3. **Configure Environment**:
   - Create a `.env` file in the `backend` folder based on `.env.production.example`.
   - Update `DATABASE_URL` with your MongoDB Atlas string.

4. **Run the Application**:
   ```bash
   # Start Backend (Port 5000)
   cd backend && npm run dev
   
   # Start Frontend (Port 3000)
   cd frontend && npm run dev
   ```

## 🚢 Deployment

For production deployment, refer to the [Deployment Guide](docs/DEPLOYMENT.md).

1. Build the assets:
   ```bash
   cd backend && npm run build
   cd ../frontend && npm run build
   ```
2. Configure your reverse proxy (Nginx) to point to the `frontend/dist` folder and proxy API requests to the backend service.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built with ❤️ for the African digital economy.
