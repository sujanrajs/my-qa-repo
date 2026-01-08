import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input', () => {
  it('should render input with value', () => {
    render(<Input value="test value" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('test value');
  });

  it('should render input with placeholder', () => {
    render(<Input value="" onChange={vi.fn()} placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
  });

  it('should render input with label', () => {
    render(<Input value="" onChange={vi.fn()} label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should show required indicator when required', () => {
    render(<Input value="" onChange={vi.fn()} label="Email" required />);
    const label = screen.getByText('Email');
    const requiredSpan = label.querySelector('.required');
    expect(requiredSpan).toBeInTheDocument();
    expect(requiredSpan).toHaveTextContent('*');
  });

  it('should not show required indicator when not required', () => {
    render(<Input value="" onChange={vi.fn()} label="Email" />);
    const label = screen.getByText('Email');
    const requiredSpan = label.querySelector('.required');
    expect(requiredSpan).not.toBeInTheDocument();
  });

  it('should call onChange when input value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<Input value="" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should render with error message', () => {
    render(<Input value="" onChange={vi.fn()} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('should apply error class when error exists', () => {
    render(<Input value="" onChange={vi.fn()} error="Error message" />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input', 'input-error');
  });

  it('should not apply error class when no error', () => {
    render(<Input value="" onChange={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('input');
    expect(input).not.toHaveClass('input-error');
  });

  it('should render with different input types', () => {
    const { rerender } = render(<Input value="" onChange={vi.fn()} type="email" />);
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');

    rerender(<Input value="" onChange={vi.fn()} type="password" />);
    input = screen.getByDisplayValue('');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should have required attribute when required prop is true', () => {
    render(<Input value="" onChange={vi.fn()} required />);
    const input = screen.getByRole('textbox');
    expect(input).toBeRequired();
  });

  describe('Password toggle', () => {
    it('should show toggle button for password input', () => {
      render(<Input value="" onChange={vi.fn()} type="password" />);
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveTextContent('Show');
    });

    it('should not show toggle button for non-password inputs', () => {
      render(<Input value="" onChange={vi.fn()} type="email" />);
      const toggleButton = screen.queryByRole('button', { name: /show password|hide password/i });
      expect(toggleButton).not.toBeInTheDocument();
    });

    it('should toggle password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      render(<Input value="testpassword123" onChange={vi.fn()} type="password" />);
      
      const input = screen.getByDisplayValue('testpassword123');
      const toggleButton = screen.getByRole('button', { name: /show password/i });
      
      // Initially password type
      expect(input).toHaveAttribute('type', 'password');
      expect(toggleButton).toHaveTextContent('Show');
      
      // Click to show password
      await user.click(toggleButton);
      
      // Should change to text type
      expect(input).toHaveAttribute('type', 'text');
      expect(toggleButton).toHaveTextContent('Hide');
      expect(toggleButton).toHaveAccessibleName('Hide password');
      
      // Click to hide password again
      await user.click(toggleButton);
      
      // Should change back to password type
      expect(input).toHaveAttribute('type', 'password');
      expect(toggleButton).toHaveTextContent('Show');
      expect(toggleButton).toHaveAccessibleName('Show password');
    });

    it('should have correct aria-label for accessibility', () => {
      const { rerender } = render(<Input value="" onChange={vi.fn()} type="password" />);
      let toggleButton = screen.getByRole('button');
      expect(toggleButton).toHaveAccessibleName('Show password');
      
      // Simulate showing password
      rerender(<Input value="" onChange={vi.fn()} type="password" />);
      // Note: We can't easily test the toggled state without user interaction,
      // but the aria-label is set correctly in the component
    });
  });
});

