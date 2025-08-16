# Railway Deployment Guide

This guide will help you deploy your Kommo CRM Analytics Dashboard to Railway using Docker containers.

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **PostgreSQL Database**: Already set up on Railway (as per previous setup)

## Deployment Steps

### Step 1: Deploy Backend

1. **Create New Railway Project**
   - Go to Railway Dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

2. **Configure Backend Service**
   - Railway will auto-detect the backend Dockerfile
   - Set the following environment variables in Railway:

   ```
   NODE_ENV=production
   PORT=3000
   FRONTEND_URL=https://your-frontend-domain.railway.app
   
   # Database Configuration (from your Railway PostgreSQL)
   DB_HOST=your-postgres-host.railway.internal
   DB_USER=postgres
   DB_PASSWORD=your-postgres-password
   DB_NAME=railway
   DB_PORT=5432
   
   # Stripe Configuration
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key
   
   # Kommo Configuration
   KOMMO_CLIENT_ID=your_kommo_client_id
   KOMMO_CLIENT_SECRET=your_kommo_client_secret
   KOMMO_REDIRECT_URI=https://your-backend-domain.railway.app/auth/kommo/callback
   ```

3. **Deploy Backend**
   - Railway will automatically build and deploy your backend
   - Note the generated domain (e.g., `https://your-backend.railway.app`)

### Step 2: Deploy Frontend

1. **Create Frontend Service**
   - In the same Railway project, click "New Service"
   - Select "GitHub Repo" again
   - Choose the same repository
   - Set the service name to "frontend"

2. **Configure Frontend Service**
   - Set the following environment variables:

   ```
   VITE_API_URL=https://your-backend-domain.railway.app/api
   ```

3. **Update Frontend Build**
   - Railway will use the frontend Dockerfile automatically
   - The build process will create a production-ready React app

### Step 3: Configure Domains

1. **Custom Domains (Optional)**
   - Go to each service's settings
   - Add custom domains if desired
   - Update environment variables with new domains

2. **Update Stripe Configuration**
   - Update your Stripe webhook endpoints to use the new backend URL
   - Update Kommo OAuth redirect URI to use the new backend URL

## Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment (production/development) | Yes |
| `PORT` | Port to run the server on | Yes |
| `FRONTEND_URL` | Frontend URL for CORS and redirects | Yes |
| `DB_HOST` | PostgreSQL host | Yes |
| `DB_USER` | PostgreSQL username | Yes |
| `DB_PASSWORD` | PostgreSQL password | Yes |
| `DB_NAME` | PostgreSQL database name | Yes |
| `DB_PORT` | PostgreSQL port | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `KOMMO_CLIENT_ID` | Kommo OAuth client ID | Yes |
| `KOMMO_CLIENT_SECRET` | Kommo OAuth client secret | Yes |
| `KOMMO_REDIRECT_URI` | Kommo OAuth redirect URI | Yes |

### Frontend Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | Yes |

## Railway Configuration Files

### Backend Railway Config (`backend/railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Frontend Railway Config (`kommo-pulse-main/railway.json`)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "nginx -g 'daemon off;'",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Monitoring and Logs

1. **View Logs**
   - Go to each service in Railway dashboard
   - Click on "Logs" tab to view real-time logs

2. **Health Checks**
   - Backend: `https://your-backend-domain.railway.app/health`
   - Frontend: `https://your-frontend-domain.railway.app/health`

3. **Metrics**
   - Railway provides built-in metrics for CPU, memory, and network usage

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Railway logs for build errors
   - Ensure all dependencies are properly listed in package.json

2. **Database Connection Issues**
   - Verify PostgreSQL environment variables
   - Check if database is accessible from Railway

3. **CORS Issues**
   - Ensure `FRONTEND_URL` is correctly set in backend
   - Check that frontend URL matches exactly

4. **Environment Variables**
   - Double-check all environment variables are set correctly
   - Ensure no typos in variable names

### Debug Commands

```bash
# Check Railway CLI (if installed)
railway login
railway status
railway logs

# Check service health
curl https://your-backend-domain.railway.app/health
curl https://your-frontend-domain.railway.app/health
```

## Scaling

Railway automatically scales your services based on traffic. You can also manually adjust:

1. **Auto-scaling**: Enabled by default
2. **Manual scaling**: Set specific instance counts in service settings
3. **Resource limits**: Adjust CPU and memory limits as needed

## Cost Optimization

1. **Development vs Production**: Use different Railway projects for dev/prod
2. **Resource Limits**: Set appropriate limits to control costs
3. **Auto-sleep**: Enable for development environments to save costs

## Security

1. **Environment Variables**: Never commit secrets to Git
2. **HTTPS**: Railway provides automatic HTTPS
3. **CORS**: Properly configured for production domains
4. **Database**: Use Railway's managed PostgreSQL for security

## Updates and Maintenance

1. **Automatic Deployments**: Railway automatically deploys on Git pushes
2. **Rollbacks**: Use Railway's rollback feature if needed
3. **Database Migrations**: Run migrations manually or via Railway CLI
4. **Backups**: Railway PostgreSQL includes automatic backups
