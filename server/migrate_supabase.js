const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function migrate() {
  require('dotenv').config();
  const connectionConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.PGHOST || 'aws-0-ap-northeast-2.pooler.supabase.com',
        port: parseInt(process.env.PGPORT || '6543', 10),
        database: process.env.PGDATABASE || 'postgres',
        user: process.env.PGUSER || 'postgres.ufoqlplrofftqrqekajx',
        password: process.env.PGPASSWORD || 'Heisenberg@409600',
        ssl: { rejectUnauthorized: false }
      };

  const client = new Client(connectionConfig);
  console.log('Connecting to Supabase PostgreSQL database...');
  await client.connect();
  console.log('Connected successfully!');

  const files = [
    { name: 'schema.sql', path: path.join(__dirname, '../database/schema.sql') },
    { name: 'indexes.sql', path: path.join(__dirname, '../database/indexes.sql') },
    { name: 'rls_policies.sql', path: path.join(__dirname, '../database/rls_policies.sql') },
    { name: 'seed.sql', path: path.join(__dirname, '../database/seed.sql') }
  ];

  for (const f of files) {
    console.log(`\nExecuting ${f.name}...`);
    const sql = fs.readFileSync(f.path, 'utf8');
    try {
      await client.query(sql);
      console.log(`✓ ${f.name} executed successfully!`);
    } catch (err) {
      console.error(`✗ Error executing ${f.name}:`, err.message);
      throw err;
    }
  }

  // Verify created tables
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('\nVerified Public Tables in Supabase:', res.rows.map(r => r.table_name));

  // Count rows in consumers
  const countRes = await client.query('SELECT count(*) FROM public.consumers;');
  console.log(`Consumers row count: ${countRes.rows[0].count}`);

  await client.end();
  console.log('\nMigration complete!');
}

migrate().catch(err => {
  console.error('\nMigration failed:', err);
  process.exit(1);
});
