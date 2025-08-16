# PostgreSQL Setup Guide for Kommo Pulse

## 🎯 Overview

This guide will help you set up PostgreSQL for your Kommo Pulse application with enhanced logging, error handling, and backup functionality. We're completely removing SQLite and using PostgreSQL as the primary database.

## 📋 Prerequisites

### 1. PostgreSQL Installation

#### **Option A: Local PostgreSQL**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### **Option B: Cloud PostgreSQL (Recommended for Production)**
- **Railway**: Add PostgreSQL service to your project
- **Supabase**: Create a new project
- **Neon**: Create a new database
- **AWS RDS**: Launch PostgreSQL instance

### 2. Environment Variables

Create a `.env` file in the `backend` directory:

```env
# PostgreSQL Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=kommo_pulse
DB_PASSWORD=your_password_here
DB_PORT=5432

# Database Pool Configuration
DB_POOL_MAX=20
DB_POOL_MIN=2
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_CONNECTION_TIMEOUT=2000
DB_STATEMENT_TIMEOUT=300000

# Backup Configuration
DB_BACKUP_PATH=./backups
DB_BACKUP_RETENTION_DAYS=30

# Environment
NODE_ENV=development

# Kommo OAuth Configuration
CLIENT_ID=your_kommo_client_id
CLIENT_SECRET=your_kommo_client_secret
CALLBACK_URL=http://localhost:3000/api/auth/callback

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
FRONTEND_URL=http://localhost:8080
```

## 🚀 Quick Setup

### Step 1: Run the Automated Setup

```bash
cd backend
npm run db:setup
```

This will:
- Check if PostgreSQL is installed
- Test the connection
- Create the database if needed
- Run the schema migration
- Update your server configuration

### Step 2: Manual Setup (if automated setup fails)

#### Create Database
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE kommo_pulse;

# Create user (optional)
CREATE USER kommo_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE kommo_pulse TO kommo_user;

# Exit psql
\q
```

#### Run Schema Migration
```bash
cd backend
psql -U your_postgres_user -d kommo_pulse -f migrations/postgres-migration.sql
```

#### Test Connection
```bash
npm run db:test
```

## 🔧 Enhanced Features

### 1. Comprehensive Logging

The new PostgreSQL setup includes enhanced logging:

- **Query Logging**: All database queries are logged with timing and performance metrics
- **Error Handling**: Detailed error messages with PostgreSQL error codes
- **Connection Monitoring**: Pool status and connection events
- **Operation Tracking**: Each database operation is tracked with unique IDs

### 2. Error Handling

Enhanced error handling includes:

- **Unique Constraint Violations**: Clear messages for duplicate entries
- **Foreign Key Violations**: Helpful messages for missing references
- **Connection Errors**: Detailed connection failure information
- **Query Timeouts**: Automatic timeout handling for long-running queries

### 3. Backup System

Automated backup functionality:

```bash
# Create backup
npm run db:backup

# Clean up old backups
npm run db:cleanup

# Check database status
npm run db:status
```

### 4. Connection Pooling

Optimized connection pooling with:

- **Configurable Pool Size**: Adjust based on your needs
- **Connection Timeouts**: Prevent hanging connections
- **Statement Timeouts**: Prevent long-running queries
- **Health Monitoring**: Pool status tracking

## 📊 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run db:setup` | Automated PostgreSQL setup |
| `npm run db:test` | Test database connection |
| `npm run db:migrate` | Run schema migration |
| `npm run db:backup` | Create database backup |
| `npm run db:cleanup` | Clean up old backups |
| `npm run db:status` | Show database statistics |

## 🔍 Monitoring and Debugging

### Check Database Status
```bash
npm run db:status
```

### Test Connection
```bash
npm run db:test
```

### View Logs
The enhanced logging will show:
- Query execution times
- Error details with PostgreSQL codes
- Connection pool status
- Performance metrics

## 🚨 Troubleshooting

### Common Issues

#### **1. Connection Refused**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if needed
sudo systemctl start postgresql
```

#### **2. Authentication Failed**
```bash
# Check PostgreSQL authentication
sudo -u postgres psql -c "\du"

# Reset password if needed
sudo -u postgres psql -c "ALTER USER your_user PASSWORD 'new_password';"
```

#### **3. Database Not Found**
```bash
# Create database
sudo -u postgres createdb kommo_pulse
```

#### **4. Permission Denied**
```bash
# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kommo_pulse TO your_user;"
```

### Performance Issues

#### **Connection Pool Exhaustion**
If you see "connection pool exhausted" errors:

1. Increase pool size in `.env`:
   ```env
   DB_POOL_MAX=50
   DB_POOL_MIN=5
   ```

2. Check for connection leaks in your code

#### **Slow Queries**
If queries are slow:

1. Check query execution times in logs
2. Add database indexes if needed
3. Optimize query patterns

## 🔒 Security Considerations

1. **Use Environment Variables**: Never hardcode database credentials
2. **SSL in Production**: Always use SSL for production connections
3. **Connection Pooling**: The setup includes secure connection pooling
4. **Regular Backups**: Automated backup system included
5. **Access Control**: Use dedicated database users with minimal privileges

## 📈 Performance Benefits

After migration to PostgreSQL, you'll experience:

- **Better Concurrency**: Multiple users can write simultaneously
- **Improved Performance**: Better query optimization
- **Scalability**: Handle larger datasets efficiently
- **Advanced Features**: JSONB, full-text search, etc.
- **Production Ready**: Better for deployment platforms
- **Enhanced Monitoring**: Detailed logging and error tracking

## 🔄 Migration from SQLite

If you have existing SQLite data:

1. **Backup your SQLite database**:
   ```bash
   cp backend/saas.db backend/saas.db.backup
   ```

2. **Run the migration script** (if you want to transfer data):
   ```bash
   node migrate-to-postgres.js
   ```

3. **Verify the migration**:
   ```bash
   npm run db:status
   ```

## ✅ Setup Checklist

- [ ] PostgreSQL installed and running
- [ ] Environment variables configured
- [ ] Database created
- [ ] Schema migration completed
- [ ] Connection test passed
- [ ] Application tested with new database
- [ ] Backup system tested
- [ ] Logging verified

## 🎉 Next Steps

1. **Test your application** with the new PostgreSQL setup
2. **Monitor the logs** for any issues
3. **Set up automated backups** if needed
4. **Configure production environment** variables
5. **Deploy to your hosting platform**

---

**🎉 Congratulations!** Your Kommo Pulse application is now running on PostgreSQL with enhanced logging, error handling, and backup functionality.
