/**
 * Chat Input Component Tests (TDD)
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatInput } from '@/components/chat/chat-input';

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, ...props }: React.ComponentProps<'button'>) => (
    <button data-testid="button" className={className} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
    function Input({ className, ...props }, ref) {
      return (
        <input data-testid="input" className={className} ref={ref} {...props} />
      );
    }
  ),
}));

describe('ChatInput', () => {
  it('should render input field and send button', () => {
    const mockOnSend = jest.fn();
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    expect(screen.getByPlaceholderText(/ask about the twitter dataset/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('should update input value when typing', () => {
    const mockOnSend = jest.fn();
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/ask about the twitter dataset/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Show me top users' } });

    expect(input.value).toBe('Show me top users');
  });

  it('should call onSend when form is submitted', async () => {
    const mockOnSend = jest.fn().mockResolvedValue(undefined);
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/ask about the twitter dataset/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Show me top users' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Show me top users');
    });
  });

  it('should clear input after sending', async () => {
    const mockOnSend = jest.fn().mockResolvedValue(undefined);
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/ask about the twitter dataset/i) as HTMLInputElement;

    fireEvent.change(input, { target: { value: 'Show me top users' } });
    fireEvent.submit(input.closest('form')!);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should disable input and button while loading', () => {
    const mockOnSend = jest.fn();
    render(<ChatInput onSend={mockOnSend} isLoading={true} />);

    const input = screen.getByPlaceholderText(/ask about the twitter dataset/i);
    const sendButton = screen.getByRole('button', { name: /send/i });

    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('should not submit empty query', () => {
    const mockOnSend = jest.fn();
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    expect(mockOnSend).not.toHaveBeenCalled();
  });

  it('should handle Enter key press', async () => {
    const mockOnSend = jest.fn().mockResolvedValue(undefined);
    render(<ChatInput onSend={mockOnSend} isLoading={false} />);

    const input = screen.getByPlaceholderText(/ask about the twitter dataset/i);

    fireEvent.change(input, { target: { value: 'Show me top users' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    await waitFor(() => {
      expect(mockOnSend).toHaveBeenCalledWith('Show me top users');
    });
  });
});

