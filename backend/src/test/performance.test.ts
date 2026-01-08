import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from './integration-helpers';
import { setupTestDatabase, clearTestDatabase, teardownTestDatabase } from './db-test-helper';
import { generateUniqueEmail, createTestUserData, resetTestCounter } from './test-data-factory';
import * as db from '../database/db';

describe('Performance Tests', () => {
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

  describe('Response Time Benchmarks', () => {
    it('should respond to health check within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/health')
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Health check should be very fast (< 100ms)
      expect(responseTime).toBeLessThan(100);
    });

    it('should respond to root endpoint within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/')
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Root endpoint should be very fast (< 100ms)
      expect(responseTime).toBeLessThan(100);
    });

    it('should register user within acceptable time', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'perf@test.com',
          password: 'password123',
          name: 'Performance Test',
        })
        .expect(201);

      const responseTime = Date.now() - startTime;
      
      // Registration includes password hashing, should be < 500ms
      expect(responseTime).toBeLessThan(500);
    });

    it('should login user within acceptable time', async () => {
      // First register a user
      const userData = {
        email: 'loginperf@test.com',
        password: 'password123',
        name: 'Login Perf Test',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const startTime = Date.now();
      
      await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Login includes password comparison, should be < 300ms
      expect(responseTime).toBeLessThan(300);
    });

    it('should get profile within acceptable time', async () => {
      // Register and get token
      const userData = {
        email: 'profileperf@test.com',
        password: 'password123',
        name: 'Profile Perf Test',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      const startTime = Date.now();
      
      await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Profile retrieval should be fast (< 200ms)
      expect(responseTime).toBeLessThan(200);
    });

    it('should update profile within acceptable time', async () => {
      // Register and get token
      const userData = {
        email: 'updateperf@test.com',
        password: 'password123',
        name: 'Update Perf Test',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      const startTime = Date.now();
      
      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      const responseTime = Date.now() - startTime;
      
      // Profile update should be fast (< 300ms)
      expect(responseTime).toBeLessThan(300);
    });
  });

  describe('Load Testing - Multiple Requests', () => {
    it('should handle 10 simultaneous health check requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      // Should complete all requests reasonably fast
      expect(totalTime).toBeLessThan(1000);
    });

    it('should handle 20 simultaneous login requests', async () => {
      // Register a user first
      const userData = {
        email: 'loadtest@test.com',
        password: 'password123',
        name: 'Load Test User',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      // Verify user was created
      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.user.email).toBe(userData.email);

      // Wait a bit to ensure user is persisted
      await new Promise((resolve) => setTimeout(resolve, 10));

      const requests = Array.from({ length: 20 }, () =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password,
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
      });

      // Should complete all requests reasonably fast (< 2 seconds)
      expect(totalTime).toBeLessThan(2000);
    });

    it('should handle 50 simultaneous profile reads', async () => {
      // Register and get token
      const userData = {
        email: 'readload@test.com',
        password: 'password123',
        name: 'Read Load Test',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      const token = registerResponse.body.token;
      
      // Verify token is valid
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      // Wait a bit to ensure user is persisted
      await new Promise((resolve) => setTimeout(resolve, 10));

      const requests = Array.from({ length: 50 }, () =>
        request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${token}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.email).toBe(userData.email);
      });

      // Should complete all requests reasonably fast (< 3 seconds)
      expect(totalTime).toBeLessThan(3000);
    });

    it('should handle mixed load (register, login, profile)', async () => {
      const requests: Promise<any>[] = [];

      // 5 registrations
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .post('/api/auth/register')
            .send({
              email: `mixed${i}@test.com`,
              password: 'password123',
              name: `Mixed User ${i}`,
            })
        );
      }

      // Wait for registrations to complete
      const registerResponses = await Promise.all(requests);
      const tokens = registerResponses
        .filter((r) => r.status === 201)
        .map((r) => r.body.token);

      // Wait a bit to ensure users are persisted
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 10 logins (using first registered user)
      if (tokens.length > 0) {
        const loginRequests = Array.from({ length: 10 }, () =>
          request(app)
            .post('/api/auth/login')
            .send({
              email: 'mixed0@test.com',
              password: 'password123',
            })
        );

        const loginResponses = await Promise.all(loginRequests);
        loginResponses.forEach((response) => {
          expect(response.status).toBe(200);
        });
      }

      // 15 profile reads
      if (tokens.length > 0) {
        const profileRequests = Array.from({ length: 15 }, () =>
          request(app)
            .get('/api/profile')
            .set('Authorization', `Bearer ${tokens[0]}`)
        );

        const profileResponses = await Promise.all(profileRequests);
        profileResponses.forEach((response) => {
          expect(response.status).toBe(200);
        });
      }

      // All operations should complete successfully
      expect(registerResponses.length).toBe(5);
    });

    it('should maintain performance under sequential requests', async () => {
      const userData = {
        email: 'sequential@test.com',
        password: 'password123',
        name: 'Sequential Test',
      };

      // Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const token = registerResponse.body.token;

      // Wait a bit to ensure user is persisted
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Perform 100 sequential profile reads
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const response = await request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
        expect(response.body.email).toBe(userData.email);
      }

      const totalTime = Date.now() - startTime;
      const avgTime = totalTime / 100;

      // Average response time should be reasonable (< 50ms per request)
      expect(avgTime).toBeLessThan(50);
    });
  });

  describe('Performance Degradation Detection', () => {
    it('should not degrade significantly with multiple operations', async () => {
      const userData = {
        email: 'degrade@test.com',
        password: 'password123',
        name: 'Degrade Test',
      };

      // Register
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const times: number[] = [];

      // Register a user and get token for profile read operations
      // Profile reads are faster and more consistent than login for performance testing
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'degradeprofile@test.com',
          password: 'password123',
          name: 'Degrade Profile',
        })
        .expect(201);

      const token = registerResponse.body.token;

      // Measure 10 profile read operations

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        await request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
        times.push(Date.now() - startTime);
      }

      // Calculate average and max
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);

      // Max time shouldn't be more than 5x the min time (allowing for some variance)
      if (minTime > 0) {
        expect(maxTime).toBeLessThan(minTime * 5);
      }
      
      // Average should be reasonable
      expect(avgTime).toBeLessThan(300);
    });
  });
});

