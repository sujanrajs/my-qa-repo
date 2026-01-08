import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { Signup } from './Signup';

const meta = {
  title: 'Pages/Signup',
  component: Signup,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof Signup>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

