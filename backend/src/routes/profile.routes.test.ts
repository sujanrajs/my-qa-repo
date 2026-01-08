import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import * as profileController from '../controllers/profile.controller';
import * as authMiddleware from '../middleware/auth.middleware';

// Mock the controller and middleware before importing routes
vi.mock('../controllers/profile.controller', () => ({
  getProfile: vi.fn((req, res) => res.json({ id: '123', email: 'test@example.com', name: 'Test' })),
  updateProfile: vi.fn((req, res) => res.json({ id: '123', email: 'test@example.com', name: 'Updated' })),
}));

// Mock auth middleware to allow requests through
vi.mock('../middleware/auth.middleware', () => ({
  authMiddleware: vi.fn((req, res, next) => {
    req.userId = '123';
    next();
  }),
}));

// Import routes after mocking
import profileRoutes from './profile.routes';

describe('Profile Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/profile', profileRoutes);
  });

  describe('GET /api/profile', () => {
    it('should call getProfile controller', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(profileController.getProfile).toHaveBeenCalled();
      expect(response.body).toMatchSnapshot();
    });

    it('should apply auth middleware', async () => {
      await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      expect(authMiddleware.authMiddleware).toHaveBeenCalled();
    });
  });

  describe('PUT /api/profile', () => {
    it('should call updateProfile controller', async () => {
      const response = await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(profileController.updateProfile).toHaveBeenCalled();
      expect(response.body).toMatchSnapshot();
    });

    it('should apply auth middleware', async () => {
      await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(authMiddleware.authMiddleware).toHaveBeenCalled();
    });

    it('should handle update request with JSON body', async () => {
      await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({ email: 'newemail@example.com' })
        .expect(200);

      expect(profileController.updateProfile).toHaveBeenCalledTimes(1);
    });
  });

  describe('Route protection', () => {
    it('should protect all profile routes with auth middleware', async () => {
      // Both GET and PUT should use auth middleware
      await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer mock-token')
        .expect(200);

      await request(app)
        .put('/api/profile')
        .set('Authorization', 'Bearer mock-token')
        .send({ name: 'Test' })
        .expect(200);

      // Auth middleware should be called for both routes
      expect(authMiddleware.authMiddleware).toHaveBeenCalled();
    });
  });

  describe('Route registration', () => {
    it('should register all profile routes', () => {
      expect(profileRoutes).toBeDefined();
    });

    it('should handle 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/profile/nonexistent')
        .set('Authorization', 'Bearer mock-token')
        .expect(404);
    });
  });
});

