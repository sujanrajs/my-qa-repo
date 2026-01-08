import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/lib/Button/Button';
import { Input } from '../../components/lib/Input/Input';
import { authService } from '../../services/auth.service';
import { handleUpdateProfile, handleLogout } from './profile.events';
import { validateProfile, type ProfileValidationResult } from '../../utils/validation';
import type { User } from '../../types/user.types';
import './Profile.css';

/**
 * Checks if error is an authentication error that requires redirect to login
 * 401 Unauthorized: User not authenticated - redirect
 * 403 Forbidden: User authenticated but lacks permission - show error, don't redirect
 */
const isAuthError = (errorMessage: string): boolean => {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    errorMessage === 'No token found' ||
    lowerMessage.includes('token expired') ||
    (lowerMessage.includes('token') && lowerMessage.includes('invalid')) ||
    (lowerMessage.includes('unauthorized') && !lowerMessage.includes('forbidden')) ||
    lowerMessage.includes('session expired')
  );
};

/**
 * Formats error message for display
 * Network errors get a user-friendly message
 */
const formatErrorMessage = (errorMessage: string): string => {
  if (errorMessage.includes('Request failed') || errorMessage.includes('Failed to fetch')) {
    return 'Network error: Unable to connect to server';
  }
  return errorMessage;
};

export const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validation, setValidation] = useState<ProfileValidationResult>({
    isValid: false,
    nameError: '',
    emailError: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userData = await authService.getProfile();
        setUser(userData);
        setName(userData.name);
        setEmail(userData.email);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        const errorMessage = error.message || 'Failed to load profile';
        
        // Redirect to login on authentication errors (401, token issues)
        // 403 Forbidden: User authenticated but lacks permission - show error, don't redirect
        if (isAuthError(errorMessage)) {
          navigate('/login');
          return;
        }
        
        setError(formatErrorMessage(errorMessage));
      }
    };

    loadProfile();
  }, [navigate]);

  const validateField = (fieldName: 'name' | 'email', value: string) => {
    const result = validateProfile(
      fieldName === 'name' ? value : name,
      fieldName === 'email' ? value : email
    );
    setValidation(result);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      validateField('name', value);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      validateField('email', value);
    }
  };

  const handleBlur = (fieldName: 'name' | 'email') => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, fieldName === 'name' ? name : email);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Mark all fields as touched
    setTouched({ name: true, email: true });
    
    // Validate all fields
    const validationResult = validateProfile(name, email);
    setValidation(validationResult);
    
    // Don't submit if validation fails
    if (!validationResult.isValid) {
      return;
    }
    
    setLoading(true);

    try {
      const updatedUser = await handleUpdateProfile({ name, email });
      setUser(updatedUser);
      setSuccess('Profile updated successfully!');
      // Reset touched state on success
      setTouched({ name: false, email: false });
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Update failed');
      const errorMessage = error.message || 'Update failed';
      
      // Redirect to login on authentication errors (401, token issues)
      // 403 Forbidden: User authenticated but lacks permission - show error, don't redirect
      if (isAuthError(errorMessage)) {
        navigate('/login');
        return;
      }
      
      setError(formatErrorMessage(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const onLogout = async () => {
    try {
      await handleLogout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  if (!user && !error) {
    return <div className="profile-container">Loading...</div>;
  }

  if (!user && error) {
    return (
      <div className="profile-container">
        <div className="profile-card">
          <h1 className="profile-title">Profile</h1>
          <div className="error-text" role="alert" aria-live="assertive">
            {error}
          </div>
          <div className="profile-actions">
            <Button type="button" variant="secondary" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">Profile</h1>
        <form onSubmit={onUpdate}>
          <Input
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
            onBlur={() => handleBlur('name')}
            error={touched.name ? validation.nameError : ''}
          />
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            error={touched.email ? validation.emailError : ''}
          />
          {error && (
            <div className="error-text" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          {success && (
            <div className="success-text" role="status" aria-live="polite">
              {success}
            </div>
          )}
          <div className="profile-actions">
            <Button type="submit" disabled={loading || !validation.isValid}>
              {loading ? 'Updating...' : 'Update Profile'}
            </Button>
            <Button type="button" variant="secondary" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
