/**
 * Chat Message Component Tests (TDD)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatMessage } from '@/components/chat/chat-message';
import { Message } from '@/lib/types';

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: React.ComponentProps<'div'>) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
}));

describe('ChatMessage', () => {
  const userMessage: Message = {
    id: '1',
    role: 'user',
    content: 'Show me top users',
    timestamp: new Date('2024-01-01T12:00:00Z'),
  };

  const assistantMessage: Message = {
    id: '2',
    role: 'assistant',
    content: 'Here are the top users...',
    cypherQuery: 'MATCH (u:User) RETURN u LIMIT 10',
    timestamp: new Date('2024-01-01T12:00:05Z'),
  };

  it('should render user message', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.getByText('Show me top users')).toBeInTheDocument();
  });

  it('should render assistant message', () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText('Here are the top users...')).toBeInTheDocument();
  });

  it('should display cypher query for assistant messages', () => {
    render(<ChatMessage message={assistantMessage} />);
    expect(screen.getByText(/MATCH \(u:User\)/)).toBeInTheDocument();
  });

  it('should not display cypher query for user messages', () => {
    render(<ChatMessage message={userMessage} />);
    expect(screen.queryByText(/MATCH/)).not.toBeInTheDocument();
  });

  it('should apply different styles for user and assistant', () => {
    const { container: userContainer } = render(<ChatMessage message={userMessage} />);
    const { container: assistantContainer } = render(<ChatMessage message={assistantMessage} />);
    
    const userDiv = userContainer.querySelector('.flex');
    const assistantDiv = assistantContainer.querySelector('.flex');

    expect(userDiv?.className).toContain('justify-end');
    expect(assistantDiv?.className).toContain('justify-start');
  });
});

