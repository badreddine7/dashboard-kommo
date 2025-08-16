#!/bin/bash

# Railway Deployment Script for Kommo CRM Analytics Dashboard
# This script helps prepare and deploy your application to Railway

echo "🚀 Railway Deployment Script for Kommo CRM Analytics Dashboard"
echo "================================================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed."
    echo "Please install it first: npm install -g @railway/cli"
    echo "Then run: railway login"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway."
    echo "Please run: railway login"
    exit 1
fi

echo "✅ Railway CLI is installed and logged in"

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project structure looks good"

# Display deployment options
echo ""
echo "Choose deployment option:"
echo "1. Deploy Backend only"
echo "2. Deploy Frontend only"
echo "3. Deploy Both (Backend + Frontend)"
echo "4. Check deployment status"
echo "5. View logs"
echo "6. Exit"

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo "🔧 Deploying Backend..."
        cd backend
        railway up
        ;;
    2)
        echo "🎨 Deploying Frontend..."
        cd kommo-pulse-main
        railway up
        ;;
    3)
        echo "🚀 Deploying Both Backend and Frontend..."
        
        echo "Deploying Backend first..."
        cd backend
        railway up &
        BACKEND_PID=$!
        
        echo "Waiting for backend deployment..."
        wait $BACKEND_PID
        
        echo "Deploying Frontend..."
        cd ../kommo-pulse-main
        railway up
        ;;
    4)
        echo "📊 Checking deployment status..."
        railway status
        ;;
    5)
        echo "📋 Viewing logs..."
        echo "Choose service:"
        echo "1. Backend logs"
        echo "2. Frontend logs"
        read -p "Enter choice (1-2): " log_choice
        
        case $log_choice in
            1)
                cd backend
                railway logs
                ;;
            2)
                cd kommo-pulse-main
                railway logs
                ;;
            *)
                echo "Invalid choice"
                ;;
        esac
        ;;
    6)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check your Railway dashboard for deployment status"
echo "2. Configure environment variables in Railway"
echo "3. Test your deployed application"
echo "4. Update Stripe webhooks and Kommo OAuth redirects"
echo ""
echo "📖 For detailed instructions, see: RAILWAY_DEPLOYMENT.md"
