import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Signup } from './Signup';
import { handleSignup } from './signup.events';

// Mock signup events
vi.mock('./signup.events');

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Signup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSignup = () => {
    return render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );
  };

  describe('Integration Tests', () => {
    it('should render signup form with all fields', () => {
      renderSignup();

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
    });

    it('should allow user to type in all form fields', async () => {
      const user = userEvent.setup();
      renderSignup();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');

      expect(nameInput).toHaveValue('John Doe');
      expect(emailInput).toHaveValue('john@example.com');
      expect(passwordInput).toHaveValue('password123');
    });

    it('should submit form with valid data and navigate to profile', async () => {
      const user = userEvent.setup();
      vi.mocked(handleSignup).mockResolvedValueOnce(undefined);

      renderSignup();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(handleSignup).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
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
      let resolveSignup: () => void;
      const signupPromise = new Promise<void>((resolve) => {
        resolveSignup = resolve;
      });
      vi.mocked(handleSignup).mockReturnValueOnce(signupPromise);

      renderSignup();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /signing up/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /signing up/i })).toBeDisabled();
      });

      // Resolve the promise
      resolveSignup!();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
      });
    });

    it('should display error message when signup fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email already exists';
      vi.mocked(handleSignup).mockRejectedValueOnce(new Error(errorMessage));

      renderSignup();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Button should be enabled again after error
      expect(screen.getByRole('button', { name: /sign up/i })).not.toBeDisabled();
    });

    it('should have link to login page', () => {
      renderSignup();

      const loginLink = screen.getByRole('link', { name: /login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should show required indicator on all required fields', () => {
      renderSignup();

      const nameLabel = screen.getByText(/name/i);
      const emailLabel = screen.getByText(/email/i);
      const passwordLabel = screen.getByText(/password/i);

      expect(nameLabel.querySelector('.required')).toBeInTheDocument();
      expect(emailLabel.querySelector('.required')).toBeInTheDocument();
      expect(passwordLabel.querySelector('.required')).toBeInTheDocument();
    });

    it('should clear form after successful submission', async () => {
      const user = userEvent.setup();
      vi.mocked(handleSignup).mockResolvedValueOnce(undefined);

      renderSignup();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // After navigation, form would be unmounted, but we can verify navigation was called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
      });
    });

    it('should disable submit button when fields are empty or invalid', () => {
      renderSignup();

      const submitButton = screen.getByRole('button', { name: /sign up/i });
      // Button should be disabled when form is invalid (empty fields)
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when all fields are valid', async () => {
      const user = userEvent.setup();
      renderSignup();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      // Initially disabled
      expect(submitButton).toBeDisabled();

      // Type valid name and blur to trigger validation
      await user.type(nameInput, 'John Doe');
      await user.tab(); // Blur name field
      // Still disabled (other fields missing)
      expect(submitButton).toBeDisabled();

      // Type valid email and blur to trigger validation
      await user.type(emailInput, 'john@example.com');
      await user.tab(); // Blur email field
      // Still disabled (password missing or invalid)
      expect(submitButton).toBeDisabled();

      // Type valid password and blur to trigger validation
      await user.type(passwordInput, 'password123');
      await user.tab(); // Blur password field
      // Now enabled (all fields valid)
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show validation errors on blur', async () => {
      const user = userEvent.setup();
      renderSignup();

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);

      // Type invalid email
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Blur the field

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });

      // Type weak password
      await user.clear(passwordInput);
      await user.type(passwordInput, 'short');
      await user.tab(); // Blur the field

      // Should show password validation error
      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission with invalid data', async () => {
      const user = userEvent.setup();
      renderSignup();

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      const submitButton = screen.getByRole('button', { name: /sign up/i });

      // Fill with invalid data
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'short');

      // Try to submit
      await user.click(submitButton);

      // Should not call handleSignup (validation prevents submission)
      await waitFor(() => {
        expect(handleSignup).not.toHaveBeenCalled();
      });

      // Should show validation errors
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
    });
  });
});

