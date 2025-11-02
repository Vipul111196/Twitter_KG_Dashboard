import { Test, TestingModule } from '@nestjs/testing';
import { HashtagsService } from './hashtags.service';
import { Neo4jService } from '../../database/neo4j.service';

describe('HashtagsService', () => {
  let service: HashtagsService;
  let neo4jService: jest.Mocked<Neo4jService>;

  beforeEach(async () => {
    const mockNeo4j = {
      executeQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HashtagsService,
        {
          provide: Neo4jService,
          useValue: mockNeo4j,
        },
      ],
    }).compile();

    service = module.get<HashtagsService>(HashtagsService);
    neo4jService = module.get(Neo4jService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getHashtagByName', () => {
    it('should return hashtag when found', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => ({ properties: { name: 'neo4j' } })),
          },
        ],
      } as any);

      const result = await service.getHashtagByName('neo4j');

      expect(result).toEqual({ name: 'neo4j' });
    });

    it('should return null when not found', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      const result = await service.getHashtagByName('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTrendingHashtags', () => {
    it('should return trending hashtags with usage counts', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => {
              if (key === 'name') return 'neo4j';
              if (key === 'usageCount') return 42;
              return null;
            }),
          },
        ],
      } as any);

      const result = await service.getTrendingHashtags(10);

      expect(result).toEqual([{ name: 'neo4j', usageCount: 42 }]);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY usageCount DESC'),
        expect.any(Object), // limit is now neo4j.int(10)
      );
    });
  });

  describe('getTotalHashtagCount', () => {
    it('should return total hashtag count', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => 344),
          },
        ],
      } as any);

      const result = await service.getTotalHashtagCount();

      expect(result).toBe(344);
    });
  });
});

