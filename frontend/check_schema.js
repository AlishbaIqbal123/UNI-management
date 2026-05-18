import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:1Guip6GWEmb93mAP@db.bigumewxldpdjrlvlkys.supabase.co:5432/postgres';

const checkSchema = async () => {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected effectively! Checking profiles table columns...');
        
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'profiles';
        `);
        console.log('Columns of table profiles:');
        console.table(res.rows);
    } catch (e) {
        console.error('Error fetching columns:', e);
    } finally {
        await client.end();
        console.log('Connection closed.');
    }
};

checkSchema();
