const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { normalizeContact, sampleContacts } = require('./contacts');

function resolveDatabasePath(dbFilePath) {
  if (dbFilePath) {
    return dbFilePath;
  }

  return process.env.DATABASE_FILE || path.join(__dirname, '..', 'data', 'contacts.db');
}

function mapContactRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function insertSeedContacts(database) {
  const insertStatement = database.prepare(`
    INSERT INTO contacts (first_name, last_name, email, phone, company, notes)
    VALUES (@first_name, @last_name, @email, @phone, @company, @notes)
  `);

  database.exec('BEGIN');

  try {
    sampleContacts.forEach((contact) => {
      const normalized = normalizeContact(contact);
      insertStatement.run({
        first_name: normalized.firstName,
        last_name: normalized.lastName,
        email: normalized.email,
        phone: normalized.phone,
        company: normalized.company,
        notes: normalized.notes
      });
    });

    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function createDatabase(dbFilePath) {
  const resolvedPath = resolveDatabasePath(dbFilePath);

  if (resolvedPath !== ':memory:') {
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  }

  const database = new DatabaseSync(resolvedPath);
  database.exec('PRAGMA journal_mode = WAL;');
  database.exec('PRAGMA foreign_keys = ON;');
  database.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const countRow = database.prepare('SELECT COUNT(*) AS count FROM contacts').get();
  if (countRow.count === 0) {
    insertSeedContacts(database);
  }

  return database;
}

function listContacts(database) {
  return database.prepare(`
    SELECT *
    FROM contacts
    ORDER BY last_name ASC, first_name ASC, id ASC
  `).all().map(mapContactRow);
}

function getContactById(database, id) {
  return mapContactRow(
    database.prepare('SELECT * FROM contacts WHERE id = ?').get(id)
  );
}

function createContact(database, contact) {
  const normalized = normalizeContact(contact);
  const result = database.prepare(`
    INSERT INTO contacts (first_name, last_name, email, phone, company, notes)
    VALUES (@first_name, @last_name, @email, @phone, @company, @notes)
  `).run({
    first_name: normalized.firstName,
    last_name: normalized.lastName,
    email: normalized.email,
    phone: normalized.phone,
    company: normalized.company,
    notes: normalized.notes
  });

  return getContactById(database, result.lastInsertRowid);
}

function updateContact(database, id, contact) {
  const normalized = normalizeContact(contact);

  database.prepare(`
    UPDATE contacts
    SET first_name = @first_name,
        last_name = @last_name,
        email = @email,
        phone = @phone,
        company = @company,
        notes = @notes,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `).run({
    id,
    first_name: normalized.firstName,
    last_name: normalized.lastName,
    email: normalized.email,
    phone: normalized.phone,
    company: normalized.company,
    notes: normalized.notes
  });

  return getContactById(database, id);
}

function deleteContact(database, id) {
  const result = database.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  return result.changes > 0;
}

module.exports = {
  createContact,
  createDatabase,
  deleteContact,
  getContactById,
  listContacts,
  updateContact
};