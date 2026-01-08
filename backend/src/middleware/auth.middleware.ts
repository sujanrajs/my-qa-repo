import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { findUserById } from '../database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  userId?: string;
  user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = findUserById(decoded.userId);
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    
    req.userId = decoded.userId;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

