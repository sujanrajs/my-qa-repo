import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Layout } from './Layout';

describe('Layout', () => {
  it('should render children', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should render Footer component', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    expect(screen.getByText('my-qa-repo')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <Layout>
        <div>First Child</div>
        <div>Second Child</div>
      </Layout>
    );
    expect(screen.getByText('First Child')).toBeInTheDocument();
    expect(screen.getByText('Second Child')).toBeInTheDocument();
  });
});

