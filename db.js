const Database = require('better-sqlite3');
const path = require('path');

// This creates a file called database.sqlite in your project folder
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new Database(dbPath, { verbose: console.log });
console.log('Connected to the SQLite database.');

module.exports = db;