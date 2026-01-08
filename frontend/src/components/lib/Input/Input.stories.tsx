import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { Input } from './Input';

type InputProps = React.ComponentProps<typeof Input>;
type InputArgs = Omit<InputProps, 'onChange'>;

// Wrapper component to handle state for interactive stories
const InputWrapper = (args: InputArgs) => {
  const [value, setValue] = useState(args.value || '');
  return (
    <Input
      {...args}
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
};

const meta = {
  title: 'Components/Input',
  component: InputWrapper,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
      description: 'Input type',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    label: {
      control: 'text',
      description: 'Label text',
    },
    required: {
      control: 'boolean',
      description: 'Whether the field is required',
    },
    error: {
      control: 'text',
      description: 'Error message to display',
    },
  },
} satisfies Meta<InputArgs>;

export default meta;
type Story = StoryObj<InputArgs>;

export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text',
    value: '',
    label: 'Label',
  },
};

export const Required: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter your email',
    value: '',
    label: 'Email',
    required: true,
  },
};

export const WithError: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    value: 'invalid-email',
    label: 'Email',
    required: true,
    error: 'Please enter a valid email address',
  },
};

