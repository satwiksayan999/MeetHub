import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupDatabase() {
  let connection;

  try {
    // Connect without database first to create it if needed
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'meethub';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`Database '${dbName}' ready`);

    // Switch to the database
    await connection.query(`USE \`${dbName}\``);

    // Create tables directly
    console.log('Creating tables...');

    // Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        timezone VARCHAR(50) DEFAULT 'UTC',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Event types table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS event_types (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        duration_minutes INT NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT,
        questions JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_slug (slug),
        INDEX idx_user_id (user_id)
      )
    `);
    console.log('✅ Created event_types table');

    // Availability table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS availability (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        day_of_week INT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_day (user_id, day_of_week)
      )
    `);
    console.log('✅ Created availability table');

    // Meetings table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        event_type_id INT NOT NULL,
        user_id INT NOT NULL,
        invitee_name VARCHAR(255) NOT NULL,
        invitee_email VARCHAR(255) NOT NULL,
        meeting_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        timezone VARCHAR(50) NOT NULL,
        status ENUM('scheduled', 'cancelled') DEFAULT 'scheduled',
        invitee_answers JSON DEFAULT NULL,
        message_to_host TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_type_id) REFERENCES event_types(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, meeting_date),
        INDEX idx_event_type (event_type_id),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ Created meetings table');

    console.log('\n✅ Database setup completed successfully!');
    console.log('Tables created: users, event_types, availability, meetings');

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();
