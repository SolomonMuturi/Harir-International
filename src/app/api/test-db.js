import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'nextdbase'
    });
    
    const [rows] = await connection.execute('SHOW TABLES');
    await connection.end();
    
    res.status(200).json({ success: true, tables: rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}