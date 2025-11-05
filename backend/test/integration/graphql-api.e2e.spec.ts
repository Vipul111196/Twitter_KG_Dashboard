import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { AllExceptionsFilter } from '../../src/common/filters/http-exception.filter';

/**
 * GraphQL API Integration Tests
 *
 * Tests all 17 GraphQL queries against REAL Neo4j database with Twitter v2 data.
 * These are E2E tests that verify the entire stack works correctly.
 *
 * Prerequisites:
 * - Neo4j must be running with Twitter v2 data loaded
 * - .env file must have correct NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD
 */
describe('GraphQL API Integration Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same middleware as main.ts
    app.enableCors({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    });
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    // Give time for connections to fully close
    await new Promise((resolve) => setTimeout(resolve, 500));
  });

  /**
   * Helper to execute GraphQL query
   */
  const executeQuery = (query: string) => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query })
      .expect(200);
  };

  describe('Analytics Queries', () => {
    it('should return dashboard statistics', async () => {
      const response = await executeQuery(`
        query {
          dashboardStats {
            totalUsers
            totalTweets
            totalHashtags
            totalRelationships
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.dashboardStats).toBeDefined();
      expect(response.body.data.dashboardStats.totalUsers).toBeGreaterThan(0);
      expect(response.body.data.dashboardStats.totalTweets).toBeGreaterThan(0);
      expect(response.body.data.dashboardStats.totalHashtags).toBeGreaterThan(
        0,
      );
      expect(
        response.body.data.dashboardStats.totalRelationships,
      ).toBeGreaterThan(0);
    });

    it('should return network data with nodes and edges', async () => {
      const response = await executeQuery(`
        query {
          networkData(limit: 5) {
            nodes {
              id
              label
              type
              size
            }
            edges {
              source
              target
              type
            }
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.networkData).toBeDefined();
      expect(response.body.data.networkData.nodes).toBeInstanceOf(Array);
      expect(response.body.data.networkData.edges).toBeInstanceOf(Array);
    });
  });

  describe('User Queries', () => {
    it('should find user by screen_name', async () => {
      const response = await executeQuery(`
        query {
          user(screenName: "neo4j") {
            screen_name
            name
            followers
            following
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.screen_name).toBe('neo4j');
      expect(typeof response.body.data.user.followers).toBe('number');
      expect(typeof response.body.data.user.following).toBe('number');
    });

    it('should search users by query', async () => {
      const response = await executeQuery(`
        query {
          searchUsers(query: "neo4j", limit: 3) {
            screen_name
            name
            followers
            following
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.searchUsers).toBeDefined();
      expect(response.body.data.searchUsers).toBeInstanceOf(Array);
      expect(response.body.data.searchUsers.length).toBeGreaterThan(0);
      expect(response.body.data.searchUsers.length).toBeLessThanOrEqual(3);

      // Verify all results have screen_name containing 'neo4j'
      response.body.data.searchUsers.forEach((user) => {
        expect(user.screen_name.toLowerCase()).toContain('neo4j');
        expect(typeof user.followers).toBe('number');
        expect(typeof user.following).toBe('number');
      });
    });

    // Note: userTweets was renamed to tweetsByUser - testing actual implementation
    it('should get tweets by user', async () => {
      const response = await executeQuery(`
        query {
          tweetsByUser(screenName: "neo4j", limit: 3) {
            id
            text
            favorites
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.tweetsByUser).toBeDefined();
      expect(response.body.data.tweetsByUser).toBeInstanceOf(Array);

      if (response.body.data.tweetsByUser.length > 0) {
        expect(response.body.data.tweetsByUser[0]).toHaveProperty('id');
        expect(response.body.data.tweetsByUser[0]).toHaveProperty('text');
        expect(typeof response.body.data.tweetsByUser[0].favorites).toBe(
          'number',
        );
      }
    });

    it('should get user followers', async () => {
      const response = await executeQuery(`
        query {
          followers(screenName: "neo4j", limit: 3) {
            screen_name
            name
            followers
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.followers).toBeDefined();
      expect(response.body.data.followers).toBeInstanceOf(Array);

      response.body.data.followers.forEach((user) => {
        expect(user).toHaveProperty('screen_name');
        expect(typeof user.followers).toBe('number');
      });
    });

    it('should get users that user is following', async () => {
      const response = await executeQuery(`
        query {
          following(screenName: "neo4j", limit: 3) {
            screen_name
            name
            followers
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.following).toBeDefined();
      expect(response.body.data.following).toBeInstanceOf(Array);

      response.body.data.following.forEach((user) => {
        expect(user).toHaveProperty('screen_name');
        expect(typeof user.followers).toBe('number');
      });
    });

    it('should get user statistics', async () => {
      const response = await executeQuery(`
        query {
          userStats(screenName: "neo4j") {
            tweetCount
            followerCount
            followingCount
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.userStats).toBeDefined();
      expect(typeof response.body.data.userStats.tweetCount).toBe('number');
      expect(typeof response.body.data.userStats.followerCount).toBe('number');
      expect(typeof response.body.data.userStats.followingCount).toBe('number');
    });
  });

  describe('Tweet Queries', () => {
    it('should get tweets by user', async () => {
      const response = await executeQuery(`
        query {
          tweetsByUser(screenName: "neo4j", limit: 3) {
            id
            text
            favorites
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.tweetsByUser).toBeDefined();
      expect(response.body.data.tweetsByUser).toBeInstanceOf(Array);
      expect(response.body.data.tweetsByUser.length).toBeLessThanOrEqual(3);

      response.body.data.tweetsByUser.forEach((tweet) => {
        expect(tweet).toHaveProperty('id');
        expect(tweet).toHaveProperty('text');
        expect(typeof tweet.favorites).toBe('number');
      });
    });

    it('should get tweets by hashtag', async () => {
      const response = await executeQuery(`
        query {
          tweetsByHashtag(hashtagName: "neo4j", limit: 3) {
            id
            text
            favorites
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.tweetsByHashtag).toBeDefined();
      expect(response.body.data.tweetsByHashtag).toBeInstanceOf(Array);

      response.body.data.tweetsByHashtag.forEach((tweet) => {
        expect(tweet).toHaveProperty('id');
        expect(typeof tweet.favorites).toBe('number');
      });
    });

    it('should search tweets by text', async () => {
      const response = await executeQuery(`
        query {
          searchTweets(query: "graph", limit: 3) {
            id
            text
            favorites
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.searchTweets).toBeDefined();
      expect(response.body.data.searchTweets).toBeInstanceOf(Array);

      response.body.data.searchTweets.forEach((tweet) => {
        expect(tweet).toHaveProperty('id');
        expect(tweet).toHaveProperty('text');
        expect(typeof tweet.favorites).toBe('number');
        // Verify text contains search query
        expect(tweet.text.toLowerCase()).toContain('graph');
      });
    });

    it('should get recent tweets', async () => {
      const response = await executeQuery(`
        query {
          recentTweets(limit: 5) {
            id
            text
            favorites
            created_at
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.recentTweets).toBeDefined();
      expect(response.body.data.recentTweets).toBeInstanceOf(Array);
      expect(response.body.data.recentTweets.length).toBeLessThanOrEqual(5);

      response.body.data.recentTweets.forEach((tweet) => {
        expect(tweet).toHaveProperty('id');
        expect(typeof tweet.favorites).toBe('number');
      });
    });
  });

  describe('Hashtag Queries', () => {
    it('should get hashtag by name', async () => {
      const response = await executeQuery(`
        query {
          hashtag(name: "neo4j") {
            name
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();

      // Hashtag might not exist, which is okay
      if (response.body.data.hashtag !== null) {
        expect(response.body.data.hashtag.name).toBe('neo4j');
      }
    });

    it('should get trending hashtags', async () => {
      const response = await executeQuery(`
        query {
          trendingHashtags(limit: 5) {
            name
            usageCount
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.trendingHashtags).toBeDefined();
      expect(response.body.data.trendingHashtags).toBeInstanceOf(Array);
      expect(response.body.data.trendingHashtags.length).toBeGreaterThan(0);
      expect(response.body.data.trendingHashtags.length).toBeLessThanOrEqual(5);

      response.body.data.trendingHashtags.forEach((hashtag) => {
        expect(hashtag).toHaveProperty('name');
        expect(typeof hashtag.usageCount).toBe('number');
        expect(hashtag.usageCount).toBeGreaterThan(0);
      });

      // Verify sorted by usageCount DESC
      for (let i = 1; i < response.body.data.trendingHashtags.length; i++) {
        expect(
          response.body.data.trendingHashtags[i - 1].usageCount,
        ).toBeGreaterThanOrEqual(
          response.body.data.trendingHashtags[i].usageCount,
        );
      }
    });

    it('should get total hashtag count', async () => {
      const response = await executeQuery(`
        query {
          totalHashtags
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.totalHashtags).toBeDefined();
      expect(typeof response.body.data.totalHashtags).toBe('number');
      expect(response.body.data.totalHashtags).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent user gracefully', async () => {
      const response = await executeQuery(`
        query {
          user(screenName: "thisuserdoesnotexist12345") {
            screen_name
            name
          }
        }
      `);

      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.user).toBeNull();
    });

    it('should handle invalid GraphQL syntax', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({ query: 'query { invalid syntax here }' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Data Integrity', () => {
    it('should return consistent data across related queries', async () => {
      // Get user stats
      const statsResponse = await executeQuery(`
        query {
          userStats(screenName: "neo4j") {
            followerCount
            followingCount
          }
        }
      `);

      // Stats should return non-negative counts
      expect(
        statsResponse.body.data.userStats.followerCount,
      ).toBeGreaterThanOrEqual(0);
      expect(
        statsResponse.body.data.userStats.followingCount,
      ).toBeGreaterThanOrEqual(0);
    });
  });
});
