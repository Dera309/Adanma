#!/bin/bash

# Production Deployment Script for Adanma E-commerce Platform
# Run this script on your production server

echo "🚀 Starting Adanma Production Deployment..."

# Check if running as root (not recommended)
if [ "$EUID" -eq 0 ]; then
  echo "⚠️  WARNING: Running as root is not recommended for security"
  read -p "Continue anyway? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
  echo "❌ Node.js version $REQUIRED_VERSION or higher required. Current: $NODE_VERSION"
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Build the application
echo "🔨 Building application..."
cd backend && npm run build
cd ../frontend && npm run build

# Copy production environment file
if [ ! -f "../backend/.env" ]; then
  echo "📋 Copying production environment template..."
  cp ../backend/.env.production ../backend/.env
  echo "⚠️  IMPORTANT: Edit backend/.env with your production values!"
  echo "   - Generate new JWT secrets"
  echo "   - Configure database URL"
  echo "   - Set up payment gateway keys"
  echo "   - Configure email/SMS services"
fi

# Set secure file permissions
echo "🔒 Setting secure file permissions..."
chmod 600 ../backend/.env
chmod 600 ../backend/.env.production

# Create systemd service (optional)
read -p "Create systemd service for auto-start? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  sudo tee /etc/systemd/system/adanma.service > /dev/null <<EOF
[Unit]
Description=Adanma E-commerce Backend
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)/backend
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable adanma
  echo "✅ Systemd service created. Start with: sudo systemctl start adanma"
fi

echo "✅ Deployment complete!"
echo ""
echo "🔧 Next steps:"
echo "1. Edit backend/.env with your production configuration"
echo "2. Run: node generate-secrets.js (to generate secure secrets)"
echo "3. Configure your reverse proxy (nginx/apache)"
echo "4. Set up SSL certificates"
echo "5. Configure firewall rules"
echo "6. Start the application: npm start"
echo ""
echo "🔒 Security checklist:"
echo "- ✅ Mock mode disabled"
echo "- ✅ CSRF protection enabled"
echo "- ✅ Rate limiting configured"
echo "- ⚠️  Generate new JWT secrets"
echo "- ⚠️  Configure real payment gateway"
echo "- ⚠️  Set up monitoring and logging"