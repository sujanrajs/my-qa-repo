import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('should render button with children', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: 'Click Me' });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Click Me
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Click Me' });
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('should render with primary variant by default', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toHaveClass('btn', 'btn-primary');
  });

  it('should render with secondary variant', () => {
    render(<Button variant="secondary">Click Me</Button>);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toHaveClass('btn', 'btn-secondary');
  });

  it('should render with type button by default', () => {
    render(<Button>Click Me</Button>);
    const button = screen.getByRole('button', { name: 'Click Me' });
    expect(button).toHaveAttribute('type', 'button');
  });

  it('should render with submit type', () => {
    render(<Button type="submit">Submit</Button>);
    const button = screen.getByRole('button', { name: 'Submit' });
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should render with reset type', () => {
    render(<Button type="reset">Reset</Button>);
    const button = screen.getByRole('button', { name: 'Reset' });
    expect(button).toHaveAttribute('type', 'reset');
  });
});

