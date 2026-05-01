const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { createContact, createDatabase, deleteContact, getContactById, listContacts, updateContact } = require('./database');
const { normalizeContact, validateContact } = require('./contacts');

function resolveStaticDir(customStaticDir) {
  if (customStaticDir === null) {
    return null;
  }

  if (customStaticDir) {
    return customStaticDir;
  }

  const distPublic = path.join(__dirname, '..', 'dist', 'public');
  if (fs.existsSync(distPublic)) {
    return distPublic;
  }

  return path.join(__dirname, '..', 'public');
}

function createApp(options = {}) {
  const database = createDatabase(options.dbFilePath);
  const staticDir = resolveStaticDir(options.staticDir);
  const app = express();

  app.use(express.json());

  app.get('/api/contacts', (request, response) => {
    response.json(listContacts(database));
  });

  app.get('/api/contacts/:id', (request, response) => {
    const contact = getContactById(database, request.params.id);

    if (!contact) {
      return response.status(404).json({ message: 'Contact not found' });
    }

    return response.json(contact);
  });

  app.post('/api/contacts', (request, response) => {
    const contact = normalizeContact(request.body);
    const errors = validateContact(contact);

    if (errors.length > 0) {
      return response.status(400).json({ message: 'Validation failed', errors });
    }

    try {
      const created = createContact(database, contact);
      return response.status(201).json(created);
    } catch (error) {
      if (String(error.message || '').includes('UNIQUE')) {
        return response.status(409).json({ message: 'Email already exists' });
      }

      throw error;
    }
  });

  app.put('/api/contacts/:id', (request, response) => {
    const existingContact = getContactById(database, request.params.id);

    if (!existingContact) {
      return response.status(404).json({ message: 'Contact not found' });
    }

    const contact = normalizeContact({ ...existingContact, ...request.body });
    const errors = validateContact(contact);

    if (errors.length > 0) {
      return response.status(400).json({ message: 'Validation failed', errors });
    }

    try {
      const updated = updateContact(database, existingContact.id, contact);
      return response.json(updated);
    } catch (error) {
      if (String(error.message || '').includes('UNIQUE')) {
        return response.status(409).json({ message: 'Email already exists' });
      }

      throw error;
    }
  });

  app.delete('/api/contacts/:id', (request, response) => {
    const deleted = deleteContact(database, request.params.id);

    if (!deleted) {
      return response.status(404).json({ message: 'Contact not found' });
    }

    return response.status(204).send();
  });

  app.use('/api', (error, request, response, next) => {
    response.status(500).json({ message: error.message || 'Internal server error' });
  });

  if (staticDir) {
    app.use(express.static(staticDir));

    app.use((request, response, next) => {
      if (request.method !== 'GET' || request.path.startsWith('/api/')) {
        return next();
      }

      const indexFile = path.join(staticDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return response.sendFile(indexFile);
      }

      return next();
    });
  }

  return { app, database };
}

module.exports = {
  createApp
};