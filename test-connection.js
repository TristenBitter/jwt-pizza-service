import { createConnection } from 'mysql2/promise';

async function testConnection() {
  try {
    const conn = await createConnection({
      host: '127.0.0.1',
      user: 'root',
      password: 'Dolphin329',
      database: 'jwtpizza',
    });
    console.log('Connected to MySQL successfully!');
    await conn.end();
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();
