import { Test, TestingModule } from '@nestjs/testing';
import { TweetsResolver } from './tweets.resolver';
import { TweetsService } from './tweets.service';
import { Tweet } from './tweets.types';

describe('TweetsResolver', () => {
  let resolver: TweetsResolver;
  let service: jest.Mocked<TweetsService>;

  const mockTweet: Tweet = {
    id: '1371815021265747970',
    id_str: '1371815021265747970',
    text: 'Test tweet about #neo4j',
    created_at: '2021-03-16T13:26:02.000Z',
    favorites: 5,
    import_method: 'user',
  };

  beforeEach(async () => {
    const mockService = {
      getTweetById: jest.fn(),
      getTweetsByUser: jest.fn(),
      getTweetsByHashtag: jest.fn(),
      searchTweets: jest.fn(),
      getRecentTweets: jest.fn(),
      getTweetWithRelationships: jest.fn(),
      getTotalTweetCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TweetsResolver,
        {
          provide: TweetsService,
          useValue: mockService,
        },
      ],
    }).compile();

    resolver = module.get<TweetsResolver>(TweetsResolver);
    service = module.get(TweetsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('tweet', () => {
    it('should return tweet by id', async () => {
      service.getTweetWithRelationships.mockResolvedValue({
        ...mockTweet,
        author: undefined,
        hashtags: [],
      });

      const result = await resolver.tweet('1371815021265747970');

      expect(result).toBeDefined();
      expect(service.getTweetWithRelationships).toHaveBeenCalledWith(
        '1371815021265747970',
      );
    });
  });

  describe('tweetsByUser', () => {
    it('should return user tweets', async () => {
      service.getTweetsByUser.mockResolvedValue([mockTweet]);

      const result = await resolver.tweetsByUser('neo4j');

      expect(result).toEqual([mockTweet]);
      expect(service.getTweetsByUser).toHaveBeenCalledWith('neo4j', 20);
    });
  });

  describe('tweetsByHashtag', () => {
    it('should return tweets by hashtag', async () => {
      service.getTweetsByHashtag.mockResolvedValue([mockTweet]);

      const result = await resolver.tweetsByHashtag('neo4j');

      expect(result).toEqual([mockTweet]);
      expect(service.getTweetsByHashtag).toHaveBeenCalledWith('neo4j', 20);
    });
  });

  describe('searchTweets', () => {
    it('should search tweets', async () => {
      service.searchTweets.mockResolvedValue([mockTweet]);

      const result = await resolver.searchTweets('neo4j');

      expect(result).toEqual([mockTweet]);
      expect(service.searchTweets).toHaveBeenCalledWith('neo4j', 20);
    });
  });

  describe('recentTweets', () => {
    it('should return recent tweets', async () => {
      service.getRecentTweets.mockResolvedValue([mockTweet]);

      const result = await resolver.recentTweets();

      expect(result).toEqual([mockTweet]);
      expect(service.getRecentTweets).toHaveBeenCalledWith(20);
    });
  });

  describe('totalTweets', () => {
    it('should return total tweet count', async () => {
      service.getTotalTweetCount.mockResolvedValue(2407);

      const result = await resolver.totalTweets();

      expect(result).toBe(2407);
    });
  });
});

