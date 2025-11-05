import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { User } from './users.types';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: jest.Mocked<UsersService>;

  const mockUser: User = {
    screen_name: 'neo4j',
    name: 'Neo4j',
    followers: 34507,
    following: 10124,
    profile_image_url: 'http://example.com/image.jpg',
    location: 'Graphs Are Everywhere',
    url: 'https://neo4j.com',
  };

  beforeEach(async () => {
    const mockService = {
      getUserByScreenName: jest.fn(),
      searchUsers: jest.fn(),
      getUsersByMinFollowers: jest.fn(),
      getTopUsers: jest.fn(),
      getUserStats: jest.fn(),
      getTotalUserCount: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    service = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('user', () => {
    it('should return user by screen name', async () => {
      // Arrange
      service.getUserByScreenName.mockResolvedValue(mockUser);

      // Act
      const result = await resolver.user('neo4j');

      // Assert
      expect(result).toEqual(mockUser);
      expect(service.getUserByScreenName).toHaveBeenCalledWith('neo4j');
    });

    it('should return null when user not found', async () => {
      // Arrange
      service.getUserByScreenName.mockResolvedValue(null);

      // Act
      const result = await resolver.user('nonexistent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('searchUsers', () => {
    it('should search users with default limit', async () => {
      // Arrange
      const mockUsers = [mockUser];
      service.searchUsers.mockResolvedValue(mockUsers);

      // Act
      const result = await resolver.searchUsers('neo');

      // Assert
      expect(result).toEqual(mockUsers);
      expect(service.searchUsers).toHaveBeenCalledWith('neo', 10);
    });

    it('should search users with custom limit', async () => {
      // Arrange
      service.searchUsers.mockResolvedValue([mockUser]);

      // Act
      await resolver.searchUsers('neo', 20);

      // Assert
      expect(service.searchUsers).toHaveBeenCalledWith('neo', 20);
    });
  });

  describe('topUsers', () => {
    it('should return top users with default limit', async () => {
      // Arrange
      const mockUsers = [mockUser];
      service.getTopUsers.mockResolvedValue(mockUsers);

      // Act
      const result = await resolver.topUsers();

      // Assert
      expect(result).toEqual(mockUsers);
      expect(service.getTopUsers).toHaveBeenCalledWith(10);
    });

    it('should return top users with custom limit', async () => {
      // Arrange
      service.getTopUsers.mockResolvedValue([mockUser]);

      // Act
      await resolver.topUsers(20);

      // Assert
      expect(service.getTopUsers).toHaveBeenCalledWith(20);
    });
  });

  describe('usersByMinFollowers', () => {
    it('should return users by minimum followers', async () => {
      // Arrange
      const mockUsers = [mockUser];
      service.getUsersByMinFollowers.mockResolvedValue(mockUsers);

      // Act
      const result = await resolver.usersByMinFollowers(10000, 10);

      // Assert
      expect(result).toEqual(mockUsers);
      expect(service.getUsersByMinFollowers).toHaveBeenCalledWith(10000, 10);
    });
  });

  describe('userStats', () => {
    it('should return user statistics', async () => {
      // Arrange
      const mockStats = {
        tweetCount: 150,
        followerCount: 34507,
        followingCount: 10124,
        uniqueHashtagsUsed: 25,
      };
      service.getUserStats.mockResolvedValue(mockStats);

      // Act
      const result = await resolver.userStats('neo4j');

      // Assert
      expect(result).toEqual(mockStats);
      expect(service.getUserStats).toHaveBeenCalledWith('neo4j');
    });
  });

  describe('totalUsers', () => {
    it('should return total user count', async () => {
      // Arrange
      service.getTotalUserCount.mockResolvedValue(38986);

      // Act
      const result = await resolver.totalUsers();

      // Assert
      expect(result).toBe(38986);
      expect(service.getTotalUserCount).toHaveBeenCalled();
    });
  });
});
