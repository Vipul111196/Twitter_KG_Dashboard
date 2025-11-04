import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from './analytics.service';
import { Neo4jService } from '../../database/neo4j.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let neo4jService: jest.Mocked<Neo4jService>;

  beforeEach(async () => {
    const mockNeo4j = {
      executeQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: Neo4jService,
          useValue: mockNeo4j,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    neo4jService = module.get(Neo4jService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => {
              const stats: Record<string, number> = {
                userCount: 38986,
                tweetCount: 2407,
                hashtagCount: 344,
                relCount: 56403,
              };
              return stats[key];
            }),
          },
        ],
      } as any);

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalUsers: 38986,
        totalTweets: 2407,
        totalHashtags: 344,
        totalRelationships: 56403,
      });
    });
  });

  describe('getNetworkData', () => {
    it('should return network nodes and edges with normalized sizes', async () => {
      const mockUser1 = {
        properties: {
          screen_name: 'neo4j',
          name: 'Neo4j',
          followers: 34507,
        },
      };

      const mockUser2 = {
        properties: {
          screen_name: 'graphconnect',
          name: 'GraphConnect',
          followers: 15000,
        },
      };

      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => {
              if (key === 'u1') return mockUser1;
              if (key === 'u2') return mockUser2;
              if (key === 'r') return {};
              return null;
            }),
          },
        ],
      } as any);

      const result = await service.getNetworkData(100);

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(1);
      
      // Sizes should be normalized to 20-60 range
      expect(result.nodes[0].id).toBe('neo4j');
      expect(result.nodes[0].label).toBe('Neo4j');
      expect(result.nodes[0].type).toBe('user');
      expect(result.nodes[0].size).toBeGreaterThanOrEqual(20);
      expect(result.nodes[0].size).toBeLessThanOrEqual(60);
      
      expect(result.nodes[1].id).toBe('graphconnect');
      expect(result.nodes[1].size).toBeGreaterThanOrEqual(20);
      expect(result.nodes[1].size).toBeLessThanOrEqual(60);
      
      // Higher follower count should have larger size
      expect(result.nodes[0].size).toBeGreaterThan(result.nodes[1].size);
      
      expect(result.edges[0]).toEqual({
        source: 'neo4j',
        target: 'graphconnect',
        type: 'FOLLOWS',
      });
    });

    it('should handle empty results', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      const result = await service.getNetworkData(100);

      expect(result.nodes).toEqual([]);
      expect(result.edges).toEqual([]);
    });
  });
});

