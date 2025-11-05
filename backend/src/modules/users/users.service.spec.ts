import { Test, TestingModule } from '@nestjs/testing';
import neo4j from 'neo4j-driver';
import { UsersService } from './users.service';
import { Neo4jService } from '../../database/neo4j.service';

describe('UsersService', () => {
  let service: UsersService;
  let neo4jService: jest.Mocked<Neo4jService>;

  // Mock Neo4j query results
  const mockNeo4jUser = {
    screen_name: 'neo4j',
    name: 'Neo4j',
    followers: 34507,
    following: 10124,
    profile_image_url: 'http://example.com/image.jpg',
    location: 'Graphs Are Everywhere',
    url: 'https://neo4j.com',
  };

  beforeEach(async () => {
    // Mock Neo4jService
    const mockNeo4j = {
      executeQuery: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: Neo4jService,
          useValue: mockNeo4j,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    neo4jService = module.get(Neo4jService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserByScreenName', () => {
    it('should return user when found', async () => {
      // Arrange
      const screenName = 'neo4j';
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => mockNeo4jUser),
            toObject: jest.fn().mockReturnValue({ u: mockNeo4jUser }),
          },
        ],
      } as any);

      // Act
      const result = await service.getUserByScreenName(screenName);

      // Assert
      expect(result).toEqual(mockNeo4jUser);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (u:User {screen_name: $screenName})'),
        { screenName },
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      // Act
      const result = await service.getUserByScreenName('nonexistent');

      // Assert
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Arrange
      neo4jService.executeQuery.mockRejectedValue(
        new Error('Database connection failed'),
      );

      // Act & Assert
      await expect(service.getUserByScreenName('neo4j')).rejects.toThrow(
        'Database connection failed',
      );
    });
  });

  describe('searchUsers', () => {
    it('should search users by screen name and name', async () => {
      // Arrange
      const query = 'neo';
      const limit = 10;
      const mockUsers = [mockNeo4jUser];

      neo4jService.executeQuery.mockResolvedValue({
        records: mockUsers.map((user) => ({
          get: jest.fn(() => user),
          toObject: jest.fn().mockReturnValue({ u: user }),
        })),
      } as any);

      // Act
      const result = await service.searchUsers(query, limit);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockNeo4jUser);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('toLower(u.screen_name) CONTAINS'),
        expect.objectContaining({ query: query.toLowerCase() }),
      );
    });

    it('should return empty array when no users found', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      // Act
      const result = await service.searchUsers('nonexistent', 10);

      // Assert
      expect(result).toEqual([]);
    });

    it('should limit results to specified limit', async () => {
      // Arrange
      const limit = 5;
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      // Act
      await service.searchUsers('test', limit);

      // Assert
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object), // limit is now neo4j.int(5)
      );
    });
  });

  describe('getUsersByMinFollowers', () => {
    it('should return users with minimum followers', async () => {
      // Arrange
      const minFollowers = 10000;
      const limit = 10;
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => mockNeo4jUser),
            toObject: jest.fn().mockReturnValue({ u: mockNeo4jUser }),
          },
        ],
      } as any);

      // Act
      const result = await service.getUsersByMinFollowers(minFollowers, limit);

      // Assert
      expect(result).toHaveLength(1);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('WHERE u.followers >= $minFollowers'),
        { minFollowers: neo4j.int(minFollowers), limit: neo4j.int(limit) },
      );
    });

    it('should order by followers descending', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      // Act
      await service.getUsersByMinFollowers(1000, 10);

      // Assert
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY u.followers DESC'),
        expect.any(Object),
      );
    });
  });

  describe('getTopUsers', () => {
    it('should return top users by follower count', async () => {
      // Arrange
      const limit = 10;
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => mockNeo4jUser),
            toObject: jest.fn().mockReturnValue({ u: mockNeo4jUser }),
          },
        ],
      } as any);

      // Act
      const result = await service.getTopUsers(limit);

      // Assert
      expect(result).toHaveLength(1);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY u.followers DESC'),
        { limit: neo4j.int(limit) },
      );
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      const screenName = 'neo4j';
      const mockStats = {
        screen_name: 'neo4j',
        tweetCount: 150,
        followerCount: 34507,
        followingCount: 10124,
        uniqueHashtagsUsed: 25,
      };

      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn((key: string) => mockStats[key]),
            toObject: jest.fn().mockReturnValue(mockStats),
          },
        ],
      } as any);

      // Act
      const result = await service.getUserStats(screenName);

      // Assert
      expect(result).toEqual({
        tweetCount: 150,
        followerCount: 34507,
        followingCount: 10124,
        uniqueHashtagsUsed: 25,
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      // Act
      const result = await service.getUserStats('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getTotalUserCount', () => {
    it('should return total count of users', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => 38986),
            toObject: jest.fn().mockReturnValue({ count: 38986 }),
          },
        ],
      } as any);

      // Act
      const result = await service.getTotalUserCount();

      // Assert
      expect(result).toBe(38986);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (u:User)'),
        {},
      );
    });
  });

  describe('getFollowers', () => {
    it('should return users who follow the specified user', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => mockNeo4jUser),
            toObject: jest.fn().mockReturnValue({ follower: mockNeo4jUser }),
          },
        ],
      } as any);

      // Act
      const result = await service.getFollowers('neo4j', 10);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockNeo4jUser);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('[:FOLLOWS]->'),
        expect.objectContaining({ screenName: 'neo4j' }),
      );
    });

    it('should return empty array when user has no followers', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      // Act
      const result = await service.getFollowers('userwithnofollowers', 10);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getFollowing', () => {
    it('should return users that the specified user follows', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [
          {
            get: jest.fn(() => mockNeo4jUser),
            toObject: jest.fn().mockReturnValue({ following: mockNeo4jUser }),
          },
        ],
      } as any);

      // Act
      const result = await service.getFollowing('neo4j', 10);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockNeo4jUser);
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('-[:FOLLOWS]->'),
        expect.objectContaining({ screenName: 'neo4j' }),
      );
    });

    it('should return empty array when user follows no one', async () => {
      // Arrange
      neo4jService.executeQuery.mockResolvedValue({
        records: [],
      } as any);

      // Act
      const result = await service.getFollowing('userfollowsnoone', 10);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
