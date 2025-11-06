/**
 * Chat Service Tests (TDD)
 * Testing RAG pipeline with OpenAI integration
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { Neo4jService } from '../../database/neo4j.service';
import { ConfigService } from '@nestjs/config';

describe('ChatService', () => {
  let service: ChatService;
  let neo4jService: Neo4jService;

  const mockNeo4jService = {
    executeQuery: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-api-key';
      if (key === 'OPENAI_MODEL_QUERY') return 'gpt-4-turbo-preview';
      if (key === 'OPENAI_MODEL_RESPONSE') return 'gpt-3.5-turbo';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: Neo4jService,
          useValue: mockNeo4jService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    neo4jService = module.get<Neo4jService>(Neo4jService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCypherQuery', () => {
    it('should reject DELETE queries', () => {
      const result = service.validateCypherQuery('MATCH (n) DELETE n');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('DELETE');
    });

    it('should reject CREATE queries', () => {
      const result = service.validateCypherQuery('CREATE (n:User)');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('CREATE');
    });

    it('should accept valid MATCH...RETURN queries', () => {
      const result = service.validateCypherQuery(
        'MATCH (u:User) RETURN u LIMIT 10',
      );
      expect(result.isValid).toBe(true);
    });

    it('should auto-add LIMIT if missing', () => {
      const result = service.validateCypherQuery('MATCH (u:User) RETURN u');
      expect(result.isValid).toBe(true);
      expect(result.query).toContain('LIMIT');
    });
  });

  describe('executeCypherQuery', () => {
    it('should execute valid Cypher query', async () => {
      const mockResult = {
        records: [
          {
            get: jest.fn((key: string) => {
              if (key === 'u') {
                return {
                  properties: {
                    screen_name: 'neo4j',
                    name: 'Neo4j',
                    followers: { low: 34507, high: 0 },
                  },
                };
              }
              return null;
            }),
            toObject: jest.fn(() => ({
              u: { screen_name: 'neo4j', name: 'Neo4j', followers: 34507 },
            })),
          },
        ],
      };

      mockNeo4jService.executeQuery.mockResolvedValue(mockResult);

      const result = await service.executeCypherQuery(
        'MATCH (u:User) RETURN u LIMIT 10',
      );

      expect(result.data).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(mockNeo4jService.executeQuery).toHaveBeenCalledWith(
        'MATCH (u:User) RETURN u LIMIT 10',
        {},
      );
    });

    it('should handle Neo4j errors gracefully', async () => {
      mockNeo4jService.executeQuery.mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(
        service.executeCypherQuery('MATCH (u:User) RETURN u LIMIT 10'),
      ).rejects.toThrow();
    });

    it('should timeout after 30 seconds', async () => {
      // Mock a query that takes too long
      mockNeo4jService.executeQuery.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 31000)),
      );

      await expect(
        service.executeCypherQuery('MATCH (u:User) RETURN u LIMIT 10'),
      ).rejects.toThrow('timeout');
    }, 35000);
  });

  describe('translateQueryToCypher', () => {
    it('should translate "top users" query', async () => {
      // Mock OpenAI response
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content:
          'MATCH (u:User) WHERE u.followers IS NOT NULL RETURN u ORDER BY u.followers DESC LIMIT 10',
        model: 'gpt-4-turbo-preview',
        tokens: 50,
      });

      const result = await service.translateQueryToCypher(
        'Show me the top 10 users by followers',
      );

      expect(result.query).toContain('MATCH');
      expect(result.query).toContain('User');
      expect(result.query).toContain('followers');
      expect(result.isValid).toBe(true);
    });

    it('should translate "trending hashtags" query', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content:
          'MATCH (t:Tweet)-[:TAGS]->(h:Hashtag) WITH h, count(t) AS usage RETURN h.name, usage ORDER BY usage DESC LIMIT 10',
        model: 'gpt-4-turbo-preview',
        tokens: 60,
      });

      const result = await service.translateQueryToCypher(
        'What are the trending hashtags?',
      );

      expect(result.query).toContain('MATCH');
      expect(result.query).toContain('Hashtag');
      expect(result.isValid).toBe(true);
    });

    it('should reject malicious query from OpenAI', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content: 'MATCH (n) DELETE n',
        model: 'gpt-4-turbo-preview',
        tokens: 20,
      });

      const result = await service.translateQueryToCypher('Delete all users');

      expect(result.isValid).toBe(false);
      expect(result.query).toContain('DELETE');
    });

    it('should handle OpenAI API errors', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(
        service.translateQueryToCypher('Show me users'),
      ).rejects.toThrow();
    });
  });

  describe('generateResponse', () => {
    it('should generate natural language response from data', async () => {
      const mockData = {
        data: [
          { screen_name: 'neo4j', followers: 34507 },
          { screen_name: 'graphdb', followers: 10000 },
        ],
        executionTime: 120,
      };

      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content:
          'Here are the top users by followers:\n1. neo4j - 34,507 followers\n2. graphdb - 10,000 followers',
        model: 'gpt-3.5-turbo',
        tokens: 45,
      });

      const result = await service.generateResponse(
        'Show me top users',
        mockData,
      );

      expect(result).toContain('neo4j');
      expect(result).toContain('34,507');
      expect(result).toContain('followers');
    });

    it('should handle empty results', async () => {
      const mockData = {
        data: [],
        executionTime: 50,
      };

      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content: 'No matching data was found for your query.',
        model: 'gpt-3.5-turbo',
        tokens: 15,
      });

      const result = await service.generateResponse(
        'Show me users named xyz',
        mockData,
      );

      expect(result).toContain('No matching data');
    });
  });

  describe('classifyIntent', () => {
    it('should classify "show me top users" as NEEDS_DATABASE', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content: JSON.stringify({
          intent: 'NEEDS_DATABASE',
          confidence: 0.95,
          reasoning: 'Query requires fetching user data from database',
        }),
        model: 'gpt-3.5-turbo',
        tokens: 30,
      });

      const result = await service.classifyIntent('Show me top users', []);

      expect(result.intent).toBe('NEEDS_DATABASE');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should classify "what was my last query" as NO_DATABASE', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content: JSON.stringify({
          intent: 'NO_DATABASE',
          confidence: 0.98,
          reasoning: 'Meta question about conversation history',
        }),
        model: 'gpt-3.5-turbo',
        tokens: 25,
      });

      const history = [
        {
          role: 'user' as const,
          content: 'Show me top users',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await service.classifyIntent(
        'What was my last query?',
        history,
      );

      expect(result.intent).toBe('NO_DATABASE');
    });

    it('should classify "thanks" as NO_DATABASE', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content: JSON.stringify({
          intent: 'NO_DATABASE',
          confidence: 0.99,
          reasoning: 'Conversational response',
        }),
        model: 'gpt-3.5-turbo',
        tokens: 20,
      });

      const result = await service.classifyIntent('Thanks!', []);

      expect(result.intent).toBe('NO_DATABASE');
    });
  });

  describe('generateContextualResponse', () => {
    it('should generate response from conversation history', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content: 'You asked me to show the top users by followers.',
        model: 'gpt-3.5-turbo',
        tokens: 20,
      });

      const history = [
        {
          role: 'user' as const,
          content: 'Show me top users',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant' as const,
          content: 'Here are the top users...',
          timestamp: new Date().toISOString(),
        },
      ];

      const result = await service.generateContextualResponse(
        'What was my last query?',
        history,
      );

      expect(result).toContain('top users');
    });

    it('should handle empty history gracefully', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');
      mockOpenAI.mockResolvedValue({
        content: "I don't have any conversation history yet.",
        model: 'gpt-3.5-turbo',
        tokens: 15,
      });

      const result = await service.generateContextualResponse(
        'What did we discuss?',
        [],
      );

      expect(result).toBeTruthy();
    });
  });

  describe('chat (end-to-end)', () => {
    it('should complete full RAG pipeline', async () => {
      // Mock OpenAI calls
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');

      // Mock intent classification
      mockOpenAI.mockResolvedValueOnce({
        content: JSON.stringify({
          intent: 'NEEDS_DATABASE',
          confidence: 0.95,
          reasoning: 'Requires fetching user data',
        }),
        model: 'gpt-3.5-turbo',
        tokens: 30,
      });

      // Mock query translation
      mockOpenAI.mockResolvedValueOnce({
        content:
          'MATCH (u:User) WHERE u.followers IS NOT NULL RETURN u ORDER BY u.followers DESC LIMIT 5',
        model: 'gpt-4-turbo-preview',
        tokens: 50,
      });

      // Mock Neo4j execution
      mockNeo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            toObject: jest.fn(() => ({
              u: { screen_name: 'neo4j', followers: 34507 },
            })),
          },
        ],
      });

      // Mock OpenAI for response generation
      mockOpenAI.mockResolvedValueOnce({
        content: 'The top user is neo4j with 34,507 followers.',
        model: 'gpt-3.5-turbo',
        tokens: 25,
      });

      const result = await service.chat('Who are the top users?');

      expect(result.cypherQuery).toContain('MATCH');
      expect(result.answer).toContain('neo4j');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
      expect(result.dataReturned).toBeDefined();
    });

    it('should reject dangerous user query', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');

      // Mock intent classification
      mockOpenAI.mockResolvedValueOnce({
        content: JSON.stringify({
          intent: 'NEEDS_DATABASE',
          confidence: 0.9,
          reasoning: 'User wants to delete data',
        }),
        model: 'gpt-3.5-turbo',
        tokens: 25,
      });

      // Mock dangerous query generation
      mockOpenAI.mockResolvedValueOnce({
        content: 'MATCH (n) DELETE n',
        model: 'gpt-4-turbo-preview',
        tokens: 20,
      });

      await expect(service.chat('Delete all data')).rejects.toThrow(
        /not allowed|blocked|destructive/i,
      );
    });

    it('should handle NO_DATABASE intent path', async () => {
      const mockOpenAI = jest.spyOn(service as any, 'callOpenAI');

      const history = [
        {
          role: 'user' as const,
          content: 'Show me top users',
          timestamp: new Date().toISOString(),
        },
        {
          role: 'assistant' as const,
          content: 'Here are the top users...',
          timestamp: new Date().toISOString(),
        },
      ];

      // Mock intent classification as NO_DATABASE
      mockOpenAI.mockResolvedValueOnce({
        content: JSON.stringify({
          intent: 'NO_DATABASE',
          confidence: 0.98,
          reasoning: 'Meta question about conversation',
        }),
        model: 'gpt-3.5-turbo',
        tokens: 25,
      });

      // Mock contextual response
      mockOpenAI.mockResolvedValueOnce({
        content: 'You asked me to show the top users by followers.',
        model: 'gpt-3.5-turbo',
        tokens: 20,
      });

      const result = await service.chat('What was my last query?', history);

      expect(result.answer).toContain('top users');
      expect(result.cypherQuery).toBe(''); // No Cypher executed
      expect(result.dataReturned.intent).toBe('NO_DATABASE');
    });
  });
});
