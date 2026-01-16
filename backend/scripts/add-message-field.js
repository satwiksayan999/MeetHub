import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addMessageField() {
  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'meethub',
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    // Check and add message_to_host column to meetings
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'meetings' AND COLUMN_NAME = 'message_to_host'`,
        [process.env.DB_NAME || 'meethub']
      );

      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE meetings 
          ADD COLUMN message_to_host TEXT DEFAULT NULL
        `);
        console.log('✅ Added message_to_host column to meetings table');
      } else {
        console.log('✅ message_to_host column already exists in meetings');
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ message_to_host column already exists in meetings');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Message field added successfully!');

  } catch (error) {
    console.error('❌ Error adding message field:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addMessageField();
