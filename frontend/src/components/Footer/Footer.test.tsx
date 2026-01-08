import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from './Footer';

describe('Footer', () => {
  it('should render footer with text', () => {
    render(<Footer />);
    expect(screen.getByText('my-qa-repo')).toBeInTheDocument();
  });

  it('should render footer element', () => {
    render(<Footer />);
    const footer = screen.getByText('my-qa-repo').closest('footer');
    expect(footer).toBeInTheDocument();
  });
});

