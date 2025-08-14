#!/bin/bash

# Kommo Pulse Production Deployment Script
set -e

echo "🚀 Starting Kommo Pulse Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    print_error "backend/.env file not found. Please create it from backend/env.example"
    exit 1
fi

if [ ! -f "kommo-pulse-main/.env" ]; then
    print_error "kommo-pulse-main/.env file not found. Please create it from kommo-pulse-main/env.example"
    exit 1
fi

print_status "Environment files found"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose down --remove-orphans

# Build images
print_status "Building Docker images..."
docker-compose build --no-cache

# Start services
print_status "Starting services..."
docker-compose up -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check backend health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status "✅ Backend is healthy"
else
    print_error "❌ Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend health
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "✅ Frontend is healthy"
else
    print_error "❌ Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
print_status "Frontend: http://localhost"
print_status "Backend API: http://localhost:3000"
print_status "Health Check: http://localhost:3000/health"

# Show running containers
print_status "Running containers:"
docker-compose ps

echo ""
print_warning "Next steps:"
echo "1. Configure your domain and SSL certificates"
echo "2. Set up monitoring and logging"
echo "3. Configure backups for the database"
echo "4. Set up CI/CD pipeline"
echo "5. Configure environment variables for production"
