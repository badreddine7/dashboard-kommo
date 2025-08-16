#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 PostgreSQL Migration Setup for Kommo Pulse');
console.log('=============================================\n');

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function setupPostgreSQL() {
  try {
    // Step 1: Check if PostgreSQL is installed
    console.log('📋 Step 1: Checking PostgreSQL installation...');
    try {
      execSync('psql --version', { stdio: 'pipe' });
      console.log('✅ PostgreSQL is installed');
    } catch (error) {
      console.log('❌ PostgreSQL is not installed or not in PATH');
      console.log('\n📥 Please install PostgreSQL first:');
      console.log('   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib');
      console.log('   macOS: brew install postgresql');
      console.log('   Windows: Download from https://www.postgresql.org/download/windows/');
      console.log('\nAfter installation, run this script again.');
      process.exit(1);
    }

    // Step 2: Get database configuration
    console.log('\n📋 Step 2: Database Configuration');
    
    const dbUser = await askQuestion('PostgreSQL username (default: postgres): ') || 'postgres';
    const dbHost = await askQuestion('PostgreSQL host (default: localhost): ') || 'localhost';
    const dbName = await askQuestion('Database name (default: kommo_pulse): ') || 'kommo_pulse';
    const dbPort = await askQuestion('PostgreSQL port (default: 5432): ') || '5432';
    
    let dbPassword = '';
    if (dbHost === 'localhost') {
      dbPassword = await askQuestion('PostgreSQL password: ');
    } else {
      dbPassword = await askQuestion('PostgreSQL password (for remote host): ');
    }

    // Step 3: Test connection
    console.log('\n📋 Step 3: Testing PostgreSQL connection...');
    try {
      const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
      execSync(`psql "${connectionString}" -c "SELECT 1;"`, { stdio: 'pipe' });
      console.log('✅ PostgreSQL connection successful');
    } catch (error) {
      console.log('❌ PostgreSQL connection failed');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if PostgreSQL is running');
      console.log('2. Verify username and password');
      console.log('3. Ensure database exists');
      console.log('4. Check firewall settings for remote connections');
      
      const createDb = await askQuestion('\nWould you like to create the database? (y/n): ');
      if (createDb.toLowerCase() === 'y') {
        try {
          const createConnectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres`;
          execSync(`psql "${createConnectionString}" -c "CREATE DATABASE ${dbName};"`, { stdio: 'pipe' });
          console.log('✅ Database created successfully');
        } catch (createError) {
          console.log('❌ Failed to create database:', createError.message);
          process.exit(1);
        }
      } else {
        process.exit(1);
      }
    }

    // Step 4: Create environment file
    console.log('\n📋 Step 4: Creating environment configuration...');
    
    const envContent = `# PostgreSQL Configuration
USE_POSTGRESQL=true
DB_USER=${dbUser}
DB_HOST=${dbHost}
DB_NAME=${dbName}
DB_PASSWORD=${dbPassword}
DB_PORT=${dbPort}

# Keep existing SQLite configuration as backup
# USE_POSTGRESQL=false
# DB_PATH=./saas.db
`;

    const envPath = path.join(__dirname, '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Environment configuration saved to ${envPath}`);

    // Step 5: Run schema migration
    console.log('\n📋 Step 5: Running schema migration...');
    try {
      const migrationPath = path.join(__dirname, 'migrations', 'postgres-migration.sql');
      if (!fs.existsSync(migrationPath)) {
        console.log('❌ Migration file not found. Please ensure migrations/postgres-migration.sql exists.');
        process.exit(1);
      }

      const connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
      execSync(`psql "${connectionString}" -f "${migrationPath}"`, { stdio: 'inherit' });
      console.log('✅ Schema migration completed');
    } catch (error) {
      console.log('❌ Schema migration failed:', error.message);
      process.exit(1);
    }

    // Step 6: Run data migration
    console.log('\n📋 Step 6: Running data migration...');
    
    const runMigration = await askQuestion('Would you like to migrate existing data from SQLite? (y/n): ');
    if (runMigration.toLowerCase() === 'y') {
      try {
        // Set environment variables for migration
        process.env.USE_POSTGRESQL = 'true';
        process.env.DB_USER = dbUser;
        process.env.DB_HOST = dbHost;
        process.env.DB_NAME = dbName;
        process.env.DB_PASSWORD = dbPassword;
        process.env.DB_PORT = dbPort;

        const { migrateData } = require('./migrate-to-postgres');
        await migrateData();
        console.log('✅ Data migration completed');
      } catch (error) {
        console.log('❌ Data migration failed:', error.message);
        console.log('You can run the migration manually later with: node migrate-to-postgres.js');
      }
    }

    // Step 7: Update server configuration
    console.log('\n📋 Step 7: Updating server configuration...');
    
    const serverPath = path.join(__dirname, 'server.js');
    if (fs.existsSync(serverPath)) {
      let serverContent = fs.readFileSync(serverPath, 'utf8');
      
      // Check if already using database-config
      if (!serverContent.includes('database-config')) {
        // Replace database import
        serverContent = serverContent.replace(
          /const\s*{\s*db,\s*dbHelpers\s*}\s*=\s*require\(['"]\.\/database['"]\);/g,
          `const { getDatabase } = require('./database-config');
const { db, dbHelpers } = getDatabase();`
        );
        
        fs.writeFileSync(serverPath, serverContent);
        console.log('✅ Server configuration updated');
      } else {
        console.log('✅ Server already configured for PostgreSQL');
      }
    }

    // Step 8: Final instructions
    console.log('\n🎉 PostgreSQL setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Copy environment variables to your .env file:');
    console.log(`   cp ${envPath} .env`);
    console.log('2. Test your application:');
    console.log('   npm start');
    console.log('3. If you encounter issues, you can rollback to SQLite by setting:');
    console.log('   USE_POSTGRESQL=false');
    console.log('\n📚 For more information, see POSTGRESQL_MIGRATION_GUIDE.md');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run setup
setupPostgreSQL();
