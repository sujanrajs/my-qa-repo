import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from './Profile';

const meta = {
  title: 'Pages/Profile',
  component: Profile,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Set up localStorage for authenticated state
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('auth_token', 'mock-token-storybook');
        window.localStorage.setItem('user_data', JSON.stringify({
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        }));
      }
      
      return (
        <BrowserRouter>
          <Story />
        </BrowserRouter>
      );
    },
  ],
} satisfies Meta<typeof Profile>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to mock fetch responses for profile API
const mockFetch = (response: any, delay = 0) => {
  const originalFetch = global.fetch;
  global.fetch = async (url: RequestInfo | URL, init?: RequestInit) => {
    const urlString = typeof url === 'string' ? url : url.toString();
    
    // Only mock profile API calls
    if (urlString.includes('/api/profile') && (!init?.method || init.method === 'GET')) {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const status = response.status || 200;
      
      if (status >= 400) {
        // For error responses, return error format that API service expects
        return new Response(JSON.stringify(response.body), {
          status: status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // For success responses
      return new Response(JSON.stringify(response.body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // For non-profile calls, use original fetch
    return originalFetch(url, init);
  };
  return () => {
    global.fetch = originalFetch;
  };
};

export const Default: Story = {
  decorators: [
    (Story) => {
      // Set up mock before component renders
      mockFetch({
        status: 200,
        body: { id: '1', email: 'test@example.com', name: 'Test User' },
      });
      
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      // Mock with very long delay to show loading state
      mockFetch(
        { status: 200, body: { id: '1', email: 'test@example.com', name: 'Test User' } },
        999999 // Very long delay
      );
      return <Story />;
    },
  ],
};
