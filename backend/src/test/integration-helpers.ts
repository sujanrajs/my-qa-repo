import express, { Express } from 'express';
import authRoutes from '../routes/auth.routes';
import profileRoutes from '../routes/profile.routes';

/**
 * Creates a test Express app with all routes and middleware
 * This mimics the production app setup but without starting a server
 */
export function createTestApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // CORS middleware (same as production)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Routes
  app.get('/', (req, res) => {
    res.json({ message: 'QA Testing App API' });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/profile', profileRoutes);

  return app;
}

