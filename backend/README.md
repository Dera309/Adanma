# Backend API

Node.js + Express + TypeScript backend for African E-commerce Web Application.

## Database Setup

### Prerequisites

1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas
2. Create a new cluster (free tier is sufficient for development)
3. Create a database user with read/write permissions
4. Whitelist your IP address or use 0.0.0.0/0 for development

### Configuration

1. Copy `.env.example` to `.env`
2. Update the `DATABASE_URL` with your MongoDB Atlas connection string:
   ```
   DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/african_ecommerce?retryWrites=true&w=majority
   ```
   
   Replace:
   - `username` with your database username
   - `password` with your database password
   - `cluster0.xxxxx.mongodb.net` with your actual cluster URL
   - `african_ecommerce` with your database name

### Setting Up the Database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to MongoDB (no migrations needed for MongoDB)
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## API Documentation

The API will be available at `http://localhost:5000`

### Health Check
- `GET /health` - Check server and database health

## Environment Variables

See `.env.example` for all required environment variables.

## Database Schema

The database schema is managed by Prisma ORM. See `prisma/schema.prisma` for the complete schema definition.
