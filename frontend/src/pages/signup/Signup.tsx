import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/lib/Button/Button';
import { Input } from '../../components/lib/Input/Input';
import { handleSignup } from './signup.events';
import { validateSignup, type SignupValidationResult } from '../../utils/validation';
import './Signup.css';

export const Signup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<SignupValidationResult>({
    isValid: false,
    nameError: '',
    emailError: '',
    passwordError: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });

  const validateField = (fieldName: 'name' | 'email' | 'password', value: string) => {
    const result = validateSignup(
      fieldName === 'name' ? value : name,
      fieldName === 'email' ? value : email,
      fieldName === 'password' ? value : password
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

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      validateField('password', value);
    }
  };

  const handleBlur = (fieldName: 'name' | 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));
    validateField(fieldName, fieldName === 'name' ? name : fieldName === 'email' ? email : password);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ name: true, email: true, password: true });
    
    // Validate all fields
    const validationResult = validateSignup(name, email, password);
    setValidation(validationResult);
    
    // Don't submit if validation fails
    if (!validationResult.isValid) {
      return;
    }
    
    setLoading(true);

    try {
      await handleSignup({ name, email, password });
      navigate('/profile');
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Signup failed');
      setError(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h1 className="signup-title">Sign Up</h1>
        <form onSubmit={onSubmit}>
          <Input
            label="Name"
            placeholder="Enter your name"
            value={name}
            onChange={handleNameChange}
            onBlur={() => handleBlur('name')}
            required
            error={touched.name ? validation.nameError : ''}
          />
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
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

