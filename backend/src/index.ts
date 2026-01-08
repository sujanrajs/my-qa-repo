import express, { Request, Response } from 'express';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (for frontend communication)
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
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'QA Testing App API' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/auth/login`);
  console.log(`  POST /api/auth/register`);
  console.log(`  POST /api/auth/logout`);
  console.log(`  GET  /api/profile`);
  console.log(`  PUT  /api/profile`);
});

