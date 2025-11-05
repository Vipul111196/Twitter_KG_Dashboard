import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User, UserStats } from './users.types';

/**
 * Users GraphQL Resolver
 *
 * Exposes user-related queries via GraphQL API.
 * Validates inputs using Zod schemas indirectly through GraphQL types.
 *
 * Design Principles:
 * - Thin resolver: delegates all logic to service layer
 * - Clear naming: query names match their purpose
 * - Documentation: every field has description for GraphQL schema
 */
@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get a single user by screen name
   */
  @Query(() => User, {
    nullable: true,
    description: 'Get user by screen name (Twitter handle)',
  })
  async user(
    @Args('screenName', { type: () => String, description: 'User screen name' })
    screenName: string,
  ): Promise<User | null> {
    return this.usersService.getUserByScreenName(screenName);
  }

  /**
   * Search users by name or screen name
   */
  @Query(() => [User], {
    description: 'Search users by screen name or display name',
  })
  async searchUsers(
    @Args('query', { type: () => String, description: 'Search query' })
    query: string,
    @Args('limit', {
      type: () => Int,
      defaultValue: 10,
      description: 'Maximum results to return',
    })
    limit: number = 10,
  ): Promise<User[]> {
    return this.usersService.searchUsers(query, limit);
  }

  /**
   * Get top users by follower count
   */
  @Query(() => [User], {
    description: 'Get top users by follower count',
  })
  async topUsers(
    @Args('limit', {
      type: () => Int,
      defaultValue: 10,
      description: 'Number of top users to return',
    })
    limit: number = 10,
  ): Promise<User[]> {
    return this.usersService.getTopUsers(limit);
  }

  /**
   * Get top users by number of tweets
   */
  @Query(() => [User], {
    description: 'Get top users by number of tweets posted',
  })
  async topUsersByTweets(
    @Args('limit', {
      type: () => Int,
      defaultValue: 5,
      description: 'Number of top users to return',
    })
    limit: number = 5,
  ): Promise<User[]> {
    return this.usersService.getTopUsersByTweets(limit);
  }

  /**
   * Get users with minimum follower count
   */
  @Query(() => [User], {
    description: 'Get users with minimum follower count',
  })
  async usersByMinFollowers(
    @Args('minFollowers', {
      type: () => Int,
      description: 'Minimum follower count',
    })
    minFollowers: number,
    @Args('limit', {
      type: () => Int,
      defaultValue: 10,
      description: 'Maximum results to return',
    })
    limit: number = 10,
  ): Promise<User[]> {
    return this.usersService.getUsersByMinFollowers(minFollowers, limit);
  }

  /**
   * Get user statistics
   */
  @Query(() => UserStats, {
    nullable: true,
    description: 'Get user activity statistics',
  })
  async userStats(
    @Args('screenName', { type: () => String, description: 'User screen name' })
    screenName: string,
  ): Promise<UserStats | null> {
    return this.usersService.getUserStats(screenName);
  }

  /**
   * Get total count of users in database
   */
  @Query(() => Int, {
    description: 'Get total number of users',
  })
  async totalUsers(): Promise<number> {
    return this.usersService.getTotalUserCount();
  }

  /**
   * Get users who follow the specified user
   */
  @Query(() => [User], {
    description: 'Get users who follow the specified user',
  })
  async followers(
    @Args('screenName', { type: () => String, description: 'User screen name' })
    screenName: string,
    @Args('limit', {
      type: () => Int,
      defaultValue: 20,
      description: 'Maximum results to return',
    })
    limit: number = 20,
  ): Promise<User[]> {
    return this.usersService.getFollowers(screenName, limit);
  }

  /**
   * Get users that the specified user follows
   */
  @Query(() => [User], {
    description: 'Get users that the specified user follows',
  })
  async following(
    @Args('screenName', { type: () => String, description: 'User screen name' })
    screenName: string,
    @Args('limit', {
      type: () => Int,
      defaultValue: 20,
      description: 'Maximum results to return',
    })
    limit: number = 20,
  ): Promise<User[]> {
    return this.usersService.getFollowing(screenName, limit);
  }
}
