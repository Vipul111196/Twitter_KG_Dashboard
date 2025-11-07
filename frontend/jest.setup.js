// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import React from 'react';

// Mock @radix-ui/react-slot which is used by Button component
jest.mock('@radix-ui/react-slot', () => ({
  Slot: ({ children, ...props }) => React.createElement('div', props, children),
}));

// Mock react-markdown for tests
jest.mock('react-markdown', () => ({
  __esModule: true,
  default: ({ children }) => React.createElement('div', {}, children),
}));

// Mock UI components globally
jest.mock('@/components/ui/card', () => ({
  Card: (props) => React.createElement('div', { 'data-testid': 'card', ...props }),
  CardHeader: (props) => React.createElement('div', { 'data-testid': 'card-header', ...props }),
  CardTitle: (props) => React.createElement('div', { 'data-testid': 'card-title', ...props }),
  CardDescription: (props) => React.createElement('div', { 'data-testid': 'card-description', ...props }),
  CardContent: (props) => React.createElement('div', { 'data-testid': 'card-content', ...props }),
  CardFooter: (props) => React.createElement('div', { 'data-testid': 'card-footer', ...props }),
}));

jest.mock('@/components/ui/button', () => ({
  Button: (props) => React.createElement('button', { 'data-testid': 'button', ...props }),
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef(function Input(props, ref) {
    return React.createElement('input', { 'data-testid': 'input', ref, ...props });
  }),
}));
