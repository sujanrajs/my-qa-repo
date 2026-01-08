import { Response } from 'express';
import { updateUser, findUserById, findUserByEmail } from '../database/db';
import { UpdateProfileRequest } from '../types/user.types';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  isValidEmail,
  isValidName,
  getNameError,
  sanitizeEmail,
  sanitizeName,
} from '../utils/validation';

export const getProfile = (req: AuthRequest, res: Response): void => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const user = findUserById(req.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = (req: AuthRequest, res: Response): void => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const { name, email }: UpdateProfileRequest = req.body;
    
    if (!name && !email) {
      res.status(400).json({ error: 'At least one field (name or email) is required' });
      return;
    }

    // Validate email format if provided
    if (email !== undefined) {
      if (!isValidEmail(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }
    }

    // Validate name if provided
    if (name !== undefined) {
      const nameError = getNameError(name);
      if (nameError) {
        res.status(400).json({ error: nameError });
        return;
      }
    }
    
    // Build updates object with only defined and validated fields
    const updates: { name?: string; email?: string } = {};
    if (name !== undefined) {
      updates.name = sanitizeName(name);
    }
    if (email !== undefined) {
      updates.email = sanitizeEmail(email);
    }

    // If email is being updated, check if it's already taken
    if (email) {
      const sanitizedEmail = sanitizeEmail(email);
      const existingUser = findUserById(req.userId);
      if (existingUser && existingUser.email !== sanitizedEmail) {
        const emailTaken = findUserByEmail(sanitizedEmail);
        if (emailTaken) {
          res.status(400).json({ error: 'Email already in use' });
          return;
        }
      }
    }
    
    const updatedUser = updateUser(req.userId, updates);
    
    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

