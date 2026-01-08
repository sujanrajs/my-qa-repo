import type { Meta, StoryObj } from '@storybook/react';
import { Layout } from './Layout';

const meta = {
  title: 'Components/Layout',
  component: Layout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Layout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem' }}>
        <h1>Page Content</h1>
        <p>This is the main content area wrapped in the Layout component.</p>
      </div>
    ),
  },
};

