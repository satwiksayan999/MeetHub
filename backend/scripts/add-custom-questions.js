import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addCustomQuestionsColumns() {
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

    // Check and add questions column to event_types
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'event_types' AND COLUMN_NAME = 'questions'`,
        [process.env.DB_NAME || 'meethub']
      );

      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE event_types 
          ADD COLUMN questions JSON DEFAULT NULL
        `);
        console.log('✅ Added questions column to event_types table');
      } else {
        console.log('✅ questions column already exists in event_types');
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ questions column already exists in event_types');
      } else {
        throw error;
      }
    }

    // Check and add invitee_answers column to meetings
    try {
      const [columns] = await connection.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'meetings' AND COLUMN_NAME = 'invitee_answers'`,
        [process.env.DB_NAME || 'meethub']
      );

      if (columns.length === 0) {
        await connection.query(`
          ALTER TABLE meetings 
          ADD COLUMN invitee_answers JSON DEFAULT NULL
        `);
        console.log('✅ Added invitee_answers column to meetings table');
      } else {
        console.log('✅ invitee_answers column already exists in meetings');
      }
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ invitee_answers column already exists in meetings');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Custom questions support added successfully!');

  } catch (error) {
    console.error('❌ Error adding custom questions support:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addCustomQuestionsColumns();
