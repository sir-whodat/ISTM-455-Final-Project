import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const request = require('supertest');
const { createApp } = require('../src/app');

describe('contacts api', () => {
  let tempDir;
  let databasePath;
  let app;
  let database;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'contacts-book-'));
    databasePath = path.join(tempDir, 'contacts.db');
    ({ app, database } = createApp({ dbFilePath: databasePath, staticDir: null }));
  });

  afterEach(() => {
    database.close();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('seeds ten contacts on first launch', async () => {
    const response = await request(app).get('/api/contacts');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(10);
    expect(response.body[0]).toHaveProperty('id');
  });

  it('gets a single contact by id', async () => {
    const response = await request(app).get('/api/contacts/1');

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(1);
    expect(response.body).toHaveProperty('firstName');
    expect(response.body).toHaveProperty('lastName');
    expect(response.body).toHaveProperty('email');
  });

  it('creates a contact', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace.hopper@example.com',
        phone: '555-0199',
        company: 'Naval Computing',
        notes: 'Created for a test case.'
      });

    expect(response.status).toBe(201);
    expect(response.body.firstName).toBe('Grace');

    const listResponse = await request(app).get('/api/contacts');
    expect(listResponse.body).toHaveLength(11);
  });

  it('rejects duplicate email addresses', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({
        firstName: 'Duplicate',
        lastName: 'Person',
        email: 'ava.turner@example.com',
        phone: '555-0123',
        company: 'Test Co',
        notes: 'Should fail because the email already exists.'
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already exists');
  });

  it('updates a contact', async () => {
    const updateResponse = await request(app)
      .put('/api/contacts/1')
      .send({
        firstName: 'Ava',
        lastName: 'Turner',
        email: 'ava.turner+updated@example.com',
        phone: '555-0001',
        company: 'Northwind',
        notes: 'Updated note.'
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.email).toBe('ava.turner+updated@example.com');
  });

  it('returns 404 when updating a non-existent contact', async () => {
    const response = await request(app)
      .put('/api/contacts/9999')
      .send({
        firstName: 'Ava',
        lastName: 'Turner',
        email: 'ava.turner+updated@example.com',
        phone: '555-0001',
        company: 'Northwind',
        notes: 'Updated note.'
      });

    expect(response.status).toBe(404);
  });

  it('rejects duplicate email addresses on update', async () => {
    // First, let's create a new contact to ensure we have a different contact
    await request(app)
      .post('/api/contacts')
      .send({
        firstName: 'Another',
        lastName: 'Person',
        email: 'another@example.com'
      });

    const response = await request(app)
      .put('/api/contacts/1') // Try to update contact 1 with the newly created contact's email
      .send({
        firstName: 'Ava',
        lastName: 'Turner',
        email: 'another@example.com'
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Email already exists');
  });

  it('rejects invalid input on update', async () => {
    const response = await request(app)
      .put('/api/contacts/1')
      .send({ firstName: '', lastName: '', email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContain('firstName is required');
    expect(response.body.errors).toContain('lastName is required');
    expect(response.body.errors).toContain('email must be a valid email address');
  });

  it('deletes a contact', async () => {
    const response = await request(app).delete('/api/contacts/1');

    expect(response.status).toBe(204);

    const missingResponse = await request(app).get('/api/contacts/1');
    expect(missingResponse.status).toBe(404);
  });

  it('returns 404 when deleting a non-existent contact', async () => {
    const response = await request(app).delete('/api/contacts/9999');

    expect(response.status).toBe(404);
  });

  it('retains falsy but valid values like 0 for phone or company', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({
        firstName: 'Zero',
        lastName: 'Cool',
        email: 'zero.cool@example.com',
        phone: 0,
        company: 0
      });

    expect(response.status).toBe(201);
    expect(response.body.phone).toBe('0');
    expect(response.body.company).toBe('0');
  });

  it('rejects invalid input', async () => {
    const response = await request(app)
      .post('/api/contacts')
      .send({ firstName: '', lastName: '', email: 'not-an-email' });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContain('firstName is required');
    expect(response.body.errors).toContain('lastName is required');
    expect(response.body.errors).toContain('email must be a valid email address');
  });
});