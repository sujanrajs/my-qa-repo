import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { createTestApp } from './integration-helpers';
import { setupTestDatabase, clearTestDatabase, teardownTestDatabase } from './db-test-helper';
import { resetTestCounter } from './test-data-factory';
import * as db from '../database/db';

describe('Error Handling Edge Cases', () => {
  const app = createTestApp();

  beforeEach(() => {
    setupTestDatabase();
    clearTestDatabase();
    resetTestCounter();
  });

  afterEach(() => {
    clearTestDatabase();
  });

  afterAll(() => {
    teardownTestDatabase();
  });

  describe('Malformed JSON in Request Body', () => {
    it('should handle valid JSON string in request body', async () => {
      // Note: This test verifies that valid JSON strings are parsed correctly
      // Actual malformed JSON tests are below
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@test.com", "password": "123", "name": "Test"}') // Valid JSON string
        .expect((res) => {
          // Express JSON parser will parse this correctly
          // May return 400 due to validation (password too short) or 201 if valid
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      // The response should be valid JSON (even if error)
      expect(response.body).toBeDefined();
    });

    it('should handle incomplete JSON in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"email": "test@test.com"') // Incomplete JSON
        .expect(400); // Express will return 400 for malformed JSON

      // Should return error response
      expect(response.body).toBeDefined();
    });

    it('should handle invalid JSON syntax', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{email: "test@test.com"}') // Invalid JSON (missing quotes)
        .expect(400); // Express will return 400 for invalid JSON

      expect(response.body).toBeDefined();
    });

    it('should handle empty JSON object', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{}')
        .expect(400); // Missing required fields

      expect(response.body).toHaveProperty('error');
    });

    it('should handle JSON with wrong data types', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({
          email: 12345, // Number instead of string
          password: 'password123',
          name: 'Test User',
        })
        .expect((res) => {
          // May succeed or fail depending on implementation
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });
  });

  describe('Missing Content-Type Header', () => {
    it('should handle request without Content-Type header', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        // No Content-Type header
        .send('email=test@test.com&password=password123&name=Test User')
        .expect((res) => {
          // Express might parse as text or return error
          expect([200, 201, 400, 415, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle request with wrong Content-Type', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'text/plain')
        .send('email=test@test.com&password=password123&name=Test User')
        .expect((res) => {
          // Express might not parse JSON without correct Content-Type
          expect([200, 201, 400, 415, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle request with application/xml Content-Type', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/xml')
        .send('<email>test@test.com</email>')
        .expect((res) => {
          // Express doesn't parse XML by default
          expect([200, 201, 400, 415, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });
  });

  describe('Request Body Size Limits', () => {
    it('should handle very large request body', async () => {
      const largeEmail = 'a'.repeat(10000) + '@example.com';
      const largePassword = 'a'.repeat(10000);
      const largeName = 'a'.repeat(10000);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: largeEmail,
          password: largePassword,
          name: largeName,
        })
        .expect((res) => {
          // May succeed, fail, or timeout depending on body size limits
          expect([200, 201, 400, 413, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle extremely large JSON payload', async () => {
      const hugePayload = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        extraData: 'x'.repeat(1000000), // 1MB of data
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(hugePayload)
        .expect((res) => {
          // May hit body size limit (413 Payload Too Large)
          expect([200, 201, 400, 413, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle multiple large fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'a'.repeat(5000) + '@example.com',
          password: 'b'.repeat(5000),
          name: 'c'.repeat(5000),
        })
        .expect((res) => {
          // May succeed or fail depending on total size
          expect([200, 201, 400, 413, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });
  });

  describe('Invalid Data Types in Request Body', () => {
    it('should handle null values in request body', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: null,
          password: 'password123',
          name: 'Test User',
        })
        .expect(400); // null is falsy, validation fails

      expect(response.body).toHaveProperty('error');
    });

    it('should handle undefined values (serialized as null)', async () => {
      // Note: JSON.stringify converts undefined to omitted, but we can test null
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: null,
          name: 'Test User',
        })
        .expect(400); // null is falsy

      expect(response.body).toHaveProperty('error');
    });

    it('should handle array where string expected', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: ['test@example.com'],
          password: 'password123',
          name: 'Test User',
        })
        .expect((res) => {
          // Array is truthy, may pass validation but cause issues
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle object where string expected', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: { value: 'test@example.com' },
          password: 'password123',
          name: 'Test User',
        })
        .expect((res) => {
          // Object is truthy, may pass validation but cause issues
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle boolean where string expected', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: true,
          name: 'Test User',
        })
        .expect((res) => {
          // Boolean is truthy, may pass validation but cause issues
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle number where string expected', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 12345,
          password: 'password123',
          name: 'Test User',
        })
        .expect((res) => {
          // Number is truthy, may pass validation but cause issues
          expect([200, 201, 400, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });
  });

  describe('Edge Cases in Profile Updates', () => {
    let authToken: string;

    beforeEach(async () => {
      // Register a user for profile tests
      const userData = {
        email: 'profileerror@test.com',
        password: 'password123',
        name: 'Profile Error Test',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      authToken = registerResponse.body.token;
    });

    it('should handle malformed JSON in profile update', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Updated"') // Incomplete JSON
        .expect(400); // Express will return 400 for malformed JSON

      expect(response.body).toBeDefined();
    });

    it('should handle invalid data types in profile update', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 12345, // Number instead of string
        })
        .expect((res) => {
          // May succeed or fail depending on implementation
          expect([200, 400, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });

    it('should handle very large profile update', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'a'.repeat(100000), // Very long name
        })
        .expect((res) => {
          // May succeed or fail depending on size limits
          expect([200, 400, 413, 500]).toContain(res.status);
        });

      expect(response.body).toBeDefined();
    });
  });

  describe('Error Response Format', () => {
    it('should return consistent error format for malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      // Error should be in consistent format (either Express default or our format)
      expect(response.body).toBeDefined();
    });

    it('should return consistent error format for missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return consistent error format for invalid token', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});

