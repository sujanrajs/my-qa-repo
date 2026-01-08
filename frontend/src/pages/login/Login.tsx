import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/lib/Button/Button';
import { Input } from '../../components/lib/Input/Input';
import { handleLogin } from './login.events';
import { validateLogin, type LoginValidationResult } from '../../utils/validation';
import './Login.css';

export const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<LoginValidationResult>({
    isValid: false,
    emailError: '',
    passwordError: '',
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const validateField = (fieldName: 'email' | 'password', value: string) => {
    const result = validateLogin(
      fieldName === 'email' ? value : email,
      fieldName === 'password' ? value : password
    );
    setValidation(result);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (touched.email) {
      validateField('email', value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      validateField('password', value);
    }
  };

  const handleBlur = (fieldName: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, fieldName === 'email' ? email : password);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ email: true, password: true });
    
    // Validate all fields
    const validationResult = validateLogin(email, password);
    setValidation(validationResult);
    
    // Don't submit if validation fails
    if (!validationResult.isValid) {
      return;
    }
    
    setLoading(true);

    try {
      await handleLogin({ email, password });
      navigate('/profile');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed');
      setError(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Login</h1>
        <form onSubmit={onSubmit}>
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => handleBlur('email')}
            required
            error={touched.email ? validation.emailError : ''}
          />
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChange={handlePasswordChange}
            onBlur={() => handleBlur('password')}
            required
            error={touched.password ? validation.passwordError : ''}
          />
          {error && (
            <div className="error-text" role="alert" aria-live="assertive">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading || !validation.isValid}>
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        <p className="signup-link">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

