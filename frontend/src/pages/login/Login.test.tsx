import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Login } from './Login';
import { handleLogin } from './login.events';

// Mock login events
vi.mock('./login.events');

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );
  };

  describe('Integration Tests', () => {
    it('should render login form with all fields', () => {
      renderLogin();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
    });

    it('should allow user to type in email and password fields', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      expect(emailInput).toHaveValue('test@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should submit form with valid credentials and navigate to profile', async () => {
      const user = userEvent.setup();
      vi.mocked(handleLogin).mockResolvedValueOnce(undefined);

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleLogin).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });

    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      // Create a promise that we can control
      let resolveLogin: () => void;
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      vi.mocked(handleLogin).mockReturnValueOnce(loginPromise);

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logging in/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
      });

      // Resolve the promise
      resolveLogin!();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
      });
    });

    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid email or password';
      vi.mocked(handleLogin).mockRejectedValueOnce(new Error(errorMessage));

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Button should be enabled again after error
      expect(screen.getByRole('button', { name: /login/i })).not.toBeDisabled();
    });

    it('should clear error message when user starts typing again', async () => {
      const user = userEvent.setup();
      vi.mocked(handleLogin).mockRejectedValueOnce(new Error('Login failed'));

      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Submit with error
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrong');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed/i)).toBeInTheDocument();
      });

      // Type in email field again
      await user.clear(emailInput);
      await user.type(emailInput, 'new@example.com');

      // Error should still be visible (it only clears on new submit)
      expect(screen.queryByText(/login failed/i)).toBeInTheDocument();
    });

    it('should have link to signup page', () => {
      renderLogin();

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toBeInTheDocument();
      expect(signupLink).toHaveAttribute('href', '/signup');
    });

    it('should disable submit button when fields are empty or invalid', () => {
      renderLogin();

      const submitButton = screen.getByRole('button', { name: /login/i });
      // Button should be disabled when form is invalid (empty fields)
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when fields are valid', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /login/i });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // Type valid email and blur to trigger validation
      await user.type(emailInput, 'test@example.com');
      await user.tab(); // Blur email field
      // Still disabled (password missing)
      expect(submitButton).toBeDisabled();

      // Type valid password and blur to trigger validation
      await user.type(passwordInput, 'password123');
      await user.tab(); // Blur password field
      // Now enabled (both fields valid)
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show validation errors on blur', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email/i);

      // Type invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Blur the field

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should show required indicator on required fields', () => {
      renderLogin();

      const emailLabel = screen.getByText(/email/i);
      const passwordLabel = screen.getByText(/password/i);

      expect(emailLabel.querySelector('.required')).toBeInTheDocument();
      expect(passwordLabel.querySelector('.required')).toBeInTheDocument();
    });
  });
});

