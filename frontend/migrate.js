import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Client } = pkg;

// Database connection URL including the password
const connectionString = 'postgresql://postgres:1Guip6GWEmb93mAP@db.bigumewxldpdjrlvlkys.supabase.co:5432/postgres';

const runMigration = async () => {
    const sqlFilePath = path.join(process.cwd(), '..', 'supabase', 'schema.sql');
    
    console.log(`Reading SQL schema from: ${sqlFilePath}`);
    
    let sql;
    try {
        sql = fs.readFileSync(sqlFilePath, 'utf8');
    } catch (e) {
        console.error('Error reading the schema file:', e);
        process.exit(1);
    }
    
    // Connect to PostgreSQL DB
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Supabase external connections
    });

    console.log('Connecting to Supabase Database...');
    try {
        await client.connect();
        console.log('Connected effectively! Executing Schema...');
        
        await client.query(sql);
        console.log('✅ Schema migration executed successfully.');
    } catch (e) {
        console.error('Error executing query:', e);
    } finally {
        await client.end();
        console.log('Database connection closed.');
    }
};

runMigration();
