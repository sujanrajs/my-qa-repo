import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import * as authController from '../controllers/auth.controller';

// Mock the controller before importing routes
vi.mock('../controllers/auth.controller', () => ({
  login: vi.fn((req, res) => res.json({ token: 'mock-token', user: {} })),
  register: vi.fn((req, res) => res.status(201).json({ token: 'mock-token', user: {} })),
  logout: vi.fn((req, res) => res.json({ message: 'Logged out successfully' })),
}));

// Import routes after mocking
import authRoutes from './auth.routes';

describe('Auth Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(authController.login).toHaveBeenCalled();
      expect(response.body).toMatchSnapshot();
    });

    it('should handle login request with JSON body', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(authController.login).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should call register controller', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        })
        .expect(201);

      expect(authController.register).toHaveBeenCalled();
      expect(response.body).toMatchSnapshot();
    });

    it('should handle register request with JSON body', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'new@example.com',
          password: 'password123',
          name: 'New User',
        })
        .expect(201);

      expect(authController.register).toHaveBeenCalledTimes(1);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should call logout controller', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(authController.logout).toHaveBeenCalled();
      expect(response.body).toMatchSnapshot();
    });

    it('should handle logout request', async () => {
      await request(app).post('/api/auth/logout').expect(200);

      expect(authController.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Route registration', () => {
    it('should register all auth routes', () => {
      // Verify routes are registered by checking they respond
      expect(authRoutes).toBeDefined();
    });

    it('should handle 404 for non-existent routes', async () => {
      await request(app).get('/api/auth/nonexistent').expect(404);
    });
  });
});

