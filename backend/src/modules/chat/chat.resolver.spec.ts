/**
 * Chat Resolver Tests (TDD)
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';

describe('ChatResolver', () => {
  let resolver: ChatResolver;
  let service: ChatService;

  const mockChatService = {
    chat: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatResolver,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
      ],
    }).compile();

    resolver = module.get<ChatResolver>(ChatResolver);
    service = module.get<ChatService>(ChatService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('chat mutation', () => {
    it('should call ChatService.chat with user query and empty history', async () => {
      const mockResponse = {
        answer: 'Here are the top users...',
        cypherQuery: 'MATCH (u:User) RETURN u LIMIT 10',
        dataReturned: { records: [], count: 0 },
        executionTime: 500,
      };

      mockChatService.chat.mockResolvedValue(mockResponse);

      const result = await resolver.chat('Show me top users', []);

      expect(service.chat).toHaveBeenCalledWith('Show me top users', []);
      expect(result).toEqual(mockResponse);
    });

    it('should call ChatService.chat with conversation history', async () => {
      const mockResponse = {
        answer: 'You asked about top users.',
        cypherQuery: '',
        dataReturned: { intent: 'NO_DATABASE' },
        executionTime: 200,
      };

      const history = [
        {
          role: 'user',
          content: 'Show me top users',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant',
          content: 'Here are the top users...',
          cypherQuery: 'MATCH (u:User) RETURN u',
          timestamp: new Date().toISOString(),
        },
      ];

      mockChatService.chat.mockResolvedValue(mockResponse);

      const result = await resolver.chat('What was my last query?', history);

      expect(service.chat).toHaveBeenCalledWith(
        'What was my last query?',
        history,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should limit history to last 50 messages', async () => {
      const mockResponse = {
        answer: 'Response',
        cypherQuery: '',
        dataReturned: {},
        executionTime: 100,
      };

      // Create 60 messages
      const largeHistory = Array.from({ length: 60 }, (_, i) => ({
        role: i % 2 === 0 ? 'user' : 'assistant',
        content: `Message ${i}`,
        timestamp: new Date().toISOString(),
      }));

      mockChatService.chat.mockResolvedValue(mockResponse);

      await resolver.chat('test query', largeHistory);

      // Should only pass last 50
      const callArgs = mockChatService.chat.mock.calls[0];
      expect(callArgs[1].length).toBe(50);
    });

    it('should handle service errors', async () => {
      mockChatService.chat.mockRejectedValue(
        new Error('Query blocked for safety'),
      );

      await expect(resolver.chat('Delete all users', [])).rejects.toThrow(
        'Query blocked for safety',
      );
    });

    it('should throw error for empty query', async () => {
      await expect(resolver.chat('', [])).rejects.toThrow();
    });

    it('should handle malicious queries', async () => {
      mockChatService.chat.mockRejectedValue(
        new Error('Query blocked for safety: Destructive operation'),
      );

      await expect(resolver.chat('DROP DATABASE', [])).rejects.toThrow(
        /blocked/i,
      );
    });
  });
});
