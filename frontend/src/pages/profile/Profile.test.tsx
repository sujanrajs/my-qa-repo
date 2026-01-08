import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, waitFor } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from './Profile';
import { authService } from '../../services/auth.service';
import { handleUpdateProfile, handleLogout } from './profile.events';
import type { User } from '../../types/user.types';

// Mock auth service and events
vi.mock('../../services/auth.service');
vi.mock('./profile.events');

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Profile', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderProfile = () => {
    return render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
  };

  describe('Integration Tests', () => {
    it('should load and display user profile data', async () => {
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);

      renderProfile();

      // Should show loading initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for profile to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      });

      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should allow user to edit name and email fields', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.clear(emailInput);
      await user.type(emailInput, 'updated@example.com');

      expect(nameInput).toHaveValue('Updated Name');
      expect(emailInput).toHaveValue('updated@example.com');
    });

    it('should submit profile update and show success message', async () => {
      const user = userEvent.setup();
      const updatedUser: User = {
        id: '1',
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      vi.mocked(handleUpdateProfile).mockResolvedValueOnce(updatedUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.clear(emailInput);
      await user.type(emailInput, 'updated@example.com');
      await user.click(updateButton);

      await waitFor(() => {
        expect(handleUpdateProfile).toHaveBeenCalledWith({
          name: 'Updated Name',
          email: 'updated@example.com',
        });
      });

      await waitFor(() => {
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during profile update', async () => {
      const user = userEvent.setup();
      let resolveUpdate: (value: User) => void;
      const updatePromise = new Promise<User>((resolve) => {
        resolveUpdate = resolve;
      });

      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      vi.mocked(handleUpdateProfile).mockReturnValueOnce(updatePromise);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(updateButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /updating/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /updating/i })).toBeDisabled();
      });

      // Resolve the promise
      resolveUpdate!(mockUser);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update profile/i })).toBeInTheDocument();
      });
    });

    it('should display error message when update fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Update failed';

      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      vi.mocked(handleUpdateProfile).mockRejectedValueOnce(new Error(errorMessage));

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Button should be enabled again after error
      expect(screen.getByRole('button', { name: /update profile/i })).not.toBeDisabled();
    });

    it('should handle logout and navigate to login', async () => {
      const user = userEvent.setup();
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      vi.mocked(handleLogout).mockResolvedValueOnce(undefined);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(handleLogout).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should navigate to login when no token is found', async () => {
      vi.mocked(authService.getProfile).mockRejectedValueOnce(
        new Error('No token found')
      );

      renderProfile();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should display error when profile load fails with server error', async () => {
      vi.mocked(authService.getProfile).mockRejectedValueOnce(
        new Error('Internal server error')
      );

      renderProfile();

      await waitFor(() => {
        expect(authService.getProfile).toHaveBeenCalled();
      });

      // Component now shows error message even when user is null
      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });

      // Profile heading should be visible with error state
      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
      // Logout button should still be available
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should display network error message when profile load fails with network error', async () => {
      vi.mocked(authService.getProfile).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      renderProfile();

      await waitFor(() => {
        expect(authService.getProfile).toHaveBeenCalled();
      });

      // Component shows network error message
      await waitFor(() => {
        expect(screen.getByText(/network error|unable to connect/i)).toBeInTheDocument();
      });

      // Profile heading should be visible with error state
      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
      // Logout button should still be available
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should display generic error when profile load fails with unknown error', async () => {
      vi.mocked(authService.getProfile).mockRejectedValueOnce(
        new Error('Failed to load profile')
      );

      renderProfile();

      await waitFor(() => {
        expect(authService.getProfile).toHaveBeenCalled();
      });

      // Component shows the error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument();
      });

      // Profile heading should be visible with error state
      expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
    });

    it('should redirect to login when token expires during profile load', async () => {
      // Test: Token expired error during profile load
      // Expected: Redirect to login page
      vi.mocked(authService.getProfile).mockRejectedValueOnce(
        new Error('Token expired')
      );

      renderProfile();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should redirect to login when token is invalid during profile load', async () => {
      // Test: Invalid token error during profile load
      // Expected: Redirect to login page
      vi.mocked(authService.getProfile).mockRejectedValueOnce(
        new Error('Invalid token')
      );

      renderProfile();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should display error (not redirect) when 403 Forbidden occurs during profile load', async () => {
      // Test: 403 Forbidden error (user authenticated but lacks permission)
      // Expected: Error message displayed, no redirect to login
      vi.mocked(authService.getProfile).mockRejectedValueOnce(
        new Error('Forbidden: Insufficient permissions')
      );

      renderProfile();

      await waitFor(() => {
        expect(authService.getProfile).toHaveBeenCalled();
      });

      // Should show error message, not redirect
      await waitFor(() => {
        expect(screen.getByText(/forbidden|insufficient permissions/i)).toBeInTheDocument();
      });

      // Should NOT redirect to login
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should redirect to login when token expires during profile update', async () => {
      // Test: Token expires during profile update
      // Expected: Redirect to login page
      const user = userEvent.setup();

      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      vi.mocked(handleUpdateProfile).mockRejectedValueOnce(
        new Error('Token expired')
      );

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(updateButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should display error (not redirect) when 403 Forbidden occurs during profile update', async () => {
      // Test: 403 Forbidden during profile update
      // Expected: Error message displayed, no redirect
      const user = userEvent.setup();

      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      vi.mocked(handleUpdateProfile).mockRejectedValueOnce(
        new Error('Forbidden: Access denied')
      );

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(updateButton);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/forbidden|access denied/i)).toBeInTheDocument();
      });

      // Should NOT redirect to login
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should format network error message during profile update', async () => {
      // Test: Network error during profile update
      // Expected: Formatted network error message displayed
      const user = userEvent.setup();

      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      vi.mocked(handleUpdateProfile).mockRejectedValueOnce(
        new Error('Failed to fetch')
      );

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(updateButton);

      // Should show formatted network error
      await waitFor(() => {
        expect(screen.getByText(/network error|unable to connect/i)).toBeInTheDocument();
      });
    });

    it('should clear error message when update succeeds after previous error', async () => {
      const user = userEvent.setup();
      const updatedUser: User = {
        id: '1',
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);
      // First update fails
      vi.mocked(handleUpdateProfile).mockRejectedValueOnce(new Error('Update failed'));
      // Second update succeeds
      vi.mocked(handleUpdateProfile).mockResolvedValueOnce(updatedUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/name/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      // First attempt - fails
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Name');
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.getByText(/update failed/i)).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.click(updateButton);

      await waitFor(() => {
        expect(screen.queryByText(/update failed/i)).not.toBeInTheDocument();
        expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
      });
    });

    it('should not show required indicator on name and email fields (partial updates allowed)', async () => {
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const nameLabel = screen.getByText(/name/i);
      const emailLabel = screen.getByText(/email/i);

      // Profile form allows partial updates, so fields are not individually required
      expect(nameLabel.querySelector('.required')).not.toBeInTheDocument();
      expect(emailLabel.querySelector('.required')).not.toBeInTheDocument();
    });

    it('should disable submit button when both fields are empty', async () => {
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      // Clear both fields
      await user.clear(nameInput);
      await user.clear(emailInput);
      await user.tab(); // Blur to trigger validation

      // Button should be disabled (at least one field required)
      await waitFor(() => {
        expect(updateButton).toBeDisabled();
      });
    });

    it('should enable submit button when at least one field is valid', async () => {
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      // Clear email but keep name
      await user.clear(emailInput);
      await user.tab(); // Blur to trigger validation

      // Button should be enabled (name is valid)
      await waitFor(() => {
        expect(updateButton).not.toBeDisabled();
      });
    });

    it('should show validation errors on blur', async () => {
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const emailInput = screen.getByLabelText(/email/i);

      // Type invalid email
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Blur the field

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
      });
    });

    it('should prevent submission with invalid data', async () => {
      vi.mocked(authService.getProfile).mockResolvedValueOnce(mockUser);

      renderProfile();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      const nameInput = screen.getByLabelText(/name/i);
      const emailInput = screen.getByLabelText(/email/i);
      const updateButton = screen.getByRole('button', { name: /update profile/i });

      // Clear name and set invalid email
      await user.clear(nameInput);
      await user.clear(emailInput);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Blur to trigger validation

      // Try to submit (should be disabled)
      expect(updateButton).toBeDisabled();

      // Should not call handleUpdateProfile
      expect(handleUpdateProfile).not.toHaveBeenCalled();
    });
  });
});

