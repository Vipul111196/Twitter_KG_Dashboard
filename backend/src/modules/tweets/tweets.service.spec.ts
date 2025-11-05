import { Test, TestingModule } from '@nestjs/testing';
import { TweetsService } from './tweets.service';
import { Neo4jService } from '../../database/neo4j.service';

describe('TweetsService', () => {
  let service: TweetsService;
  let neo4jService: jest.Mocked<Neo4jService>;

  const mockTweet = {
    id: '1371815021265747970',
    id_str: '1371815021265747970',
    text: 'Test tweet about #neo4j',
    created_at: '2021-03-16T13:26:02.000Z',
    favorites: 5,
    import_method: 'user',
  };

  const mockUser = {
    screen_name: 'neo4j',
    name: 'Neo4j',
    followers: 34507,
    following: 10124,
  };

  const mockHashtag = {
    name: 'neo4j',
  };

  beforeEach(async () => {
    const mockNeo4j = {
      executeQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TweetsService,
        {
          provide: Neo4jService,
          useValue: mockNeo4j,
        },
      ],
    }).compile();

    service = module.get<TweetsService>(TweetsService);
    neo4jService = module.get(Neo4jService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTweetById', () => {
    it('should return tweet when found', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => mockTweet),
            toObject: jest.fn().mockReturnValue({ t: mockTweet }),
          },
        ],
      } as any);

      const result = await service.getTweetById('1371815021265747970');

      expect(result).toEqual(mockTweet);
    });

    it('should return null when tweet not found', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      const result = await service.getTweetById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTweetsByUser', () => {
    it('should return user tweets ordered by date', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => mockTweet),
            toObject: jest.fn().mockReturnValue({ t: mockTweet }),
          },
        ],
      } as any);

      const result = await service.getTweetsByUser('neo4j', 20);

      expect(result).toHaveLength(1);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('POSTS'),
        expect.objectContaining({ screenName: 'neo4j' }),
      );
    });
  });

  describe('getTweetsByHashtag', () => {
    it('should return tweets with hashtag', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => mockTweet),
            toObject: jest.fn().mockReturnValue({ t: mockTweet }),
          },
        ],
      } as any);

      const result = await service.getTweetsByHashtag('neo4j', 20);

      expect(result).toHaveLength(1);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('TAGS'),
        expect.objectContaining({ hashtagName: 'neo4j' }),
      );
    });
  });

  describe('searchTweets', () => {
    it('should search tweets by text content', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => mockTweet),
            toObject: jest.fn().mockReturnValue({ t: mockTweet }),
          },
        ],
      } as any);

      const result = await service.searchTweets('neo4j', 20);

      expect(result).toHaveLength(1);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('CONTAINS'),
        expect.objectContaining({ query: 'neo4j' }),
      );
    });
  });

  describe('getRecentTweets', () => {
    it('should return recent tweets ordered by date', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => mockTweet),
            toObject: jest.fn().mockReturnValue({ t: mockTweet }),
          },
        ],
      } as any);

      const result = await service.getRecentTweets(20);

      expect(result).toHaveLength(1);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY t.created_at DESC'),
        expect.any(Object), // limit is now neo4j.int(20)
      );
    });
  });

  describe('getTweetWithRelationships', () => {
    it('should return tweet with author and hashtags', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => {
              if (key === 't') return mockTweet;
              if (key === 'author') return mockUser;
              if (key === 'hashtags') return [mockHashtag];
              return null;
            }),
            toObject: jest.fn().mockReturnValue({
              t: mockTweet,
              author: mockUser,
              hashtags: [mockHashtag],
            }),
          },
        ],
      } as any);

      const result = await service.getTweetWithRelationships(
        '1371815021265747970',
      );

      expect(result).toEqual({
        ...mockTweet,
        author: mockUser,
        hashtags: [mockHashtag],
      });
    });

    it('should return null when tweet not found', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      const result = await service.getTweetWithRelationships('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTotalTweetCount', () => {
    it('should return total tweet count', async () => {
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => 2407),
            toObject: jest.fn().mockReturnValue({ count: 2407 }),
          },
        ],
      } as any);

      const result = await service.getTotalTweetCount();

      expect(result).toBe(2407);
    });
  });
});
