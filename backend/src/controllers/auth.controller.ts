import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../database/db';
import { LoginRequest, RegisterRequest } from '../types/user.types';
import {
  isValidEmail,
  isNonEmptyString,
  isValidPassword,
  isValidName,
  getNameError,
  sanitizeEmail,
  sanitizeName,
} from '../utils/validation';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Sanitize email (trim and lowercase)
    const sanitizedEmail = sanitizeEmail(email);
    
    const user = findUserByEmail(sanitizedEmail);
    
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name }: RegisterRequest = req.body;
    
    // Validate required fields
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate password strength
    if (!isValidPassword(password)) {
      res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one letter and one number',
      });
      return;
    }

    // Validate name
    const nameError = getNameError(name);
    if (nameError) {
      res.status(400).json({ error: nameError });
      return;
    }

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(name);
    
    // Check if user already exists
    const existingUser = findUserByEmail(sanitizedEmail);
    if (existingUser) {
      res.status(400).json({ error: 'User with this email already exists' });
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with sanitized data
    const user = createUser({
      email: sanitizedEmail,
      password: hashedPassword,
      name: sanitizedName,
    });
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const logout = (req: Request, res: Response): void => {
  // Since we're using JWT, logout is handled client-side by removing the token
  // But we can provide an endpoint for consistency
  res.json({ message: 'Logged out successfully' });
};

