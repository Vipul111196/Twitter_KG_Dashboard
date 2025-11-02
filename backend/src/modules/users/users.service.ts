import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../../database/neo4j.service';
import { User, UserStats } from './users.types';

/**
 * Users Service
 *
 * Handles all user-related database queries using Cypher.
 * Uses the REAL Twitter v2 schema with screen_name and POSTS relationship.
 *
 * Design Principles:
 * - Single Responsibility: Only handles user queries
 * - DRY: Common query patterns extracted to helper methods
 * - Fail Loudly: All database errors propagate with clear context
 * - Testability: Depends only on Neo4jService interface
 */
@Injectable()
export class UsersService {
  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * Get user by screen name (Twitter handle)
   *
   * @param screenName - User's screen name (e.g., 'neo4j')
   * @returns User object or null if not found
   */
  async getUserByScreenName(screenName: string): Promise<User | null> {
    const query = `
      MATCH (u:User {screen_name: $screenName})
      RETURN u
    `;

    const result = await this.neo4jService.executeQuery(query, {
      screenName,
    });

    if (result.records.length === 0) {
      return null;
    }

    const userNode = result.records[0].get('u');
    return this.mapNodeToUser(userNode);
  }

  /**
   * Search users by screen name or display name
   *
   * @param query - Search term
   * @param limit - Maximum results to return
   * @returns Array of matching users
   */
  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const cypherQuery = `
      MATCH (u:User)
      WHERE toLower(u.screen_name) CONTAINS $query
         OR toLower(u.name) CONTAINS $query
      RETURN u
      ORDER BY u.followers DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(cypherQuery, {
      query: query.toLowerCase(),
      limit: neo4j.int(limit), // Convert to Neo4j Integer
    });

    return result.records.map((record) =>
      this.mapNodeToUser(record.get('u')),
    );
  }

  /**
   * Get users with minimum follower count
   *
   * @param minFollowers - Minimum number of followers
   * @param limit - Maximum results to return
   * @returns Array of users sorted by follower count
   */
  async getUsersByMinFollowers(
    minFollowers: number,
    limit: number = 10,
  ): Promise<User[]> {
    const query = `
      MATCH (u:User)
      WHERE u.followers >= $minFollowers
      RETURN u
      ORDER BY u.followers DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, {
      minFollowers,
      limit,
    });

    return result.records.map((record) =>
      this.mapNodeToUser(record.get('u')),
    );
  }

  /**
   * Get top users by follower count
   *
   * @param limit - Number of top users to return
   * @returns Array of top users
   */
  async getTopUsers(limit: number = 10): Promise<User[]> {
    const query = `
      MATCH (u:User)
      WHERE u.followers IS NOT NULL
      RETURN u
      ORDER BY u.followers DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, { limit });

    return result.records.map((record) =>
      this.mapNodeToUser(record.get('u')),
    );
  }

  /**
   * Get user statistics (tweets, followers, etc.)
   *
   * @param screenName - User's screen name
   * @returns User statistics or null if user not found
   */
  async getUserStats(screenName: string): Promise<UserStats | null> {
    const query = `
      MATCH (u:User {screen_name: $screenName})
      OPTIONAL MATCH (u)-[:POSTS]->(t:Tweet)
      OPTIONAL MATCH (t)-[:TAGS]->(h:Hashtag)
      RETURN 
        u.screen_name AS screen_name,
        count(DISTINCT t) AS tweetCount,
        coalesce(u.followers, 0) AS followerCount,
        coalesce(u.following, 0) AS followingCount,
        count(DISTINCT h) AS uniqueHashtagsUsed
    `;

    const result = await this.neo4jService.executeQuery(query, {
      screenName,
    });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    
    // Handle Neo4j Integer objects
    const tweetCount = this.extractNumber(record.get('tweetCount'));
    const followerCount = this.extractNumber(record.get('followerCount'));
    const followingCount = this.extractNumber(record.get('followingCount'));
    const uniqueHashtagsUsed = this.extractNumber(record.get('uniqueHashtagsUsed'));

    return {
      tweetCount,
      followerCount,
      followingCount,
      uniqueHashtagsUsed,
    };
  }

  /**
   * Get total count of users in database
   *
   * @returns Total user count
   */
  async getTotalUserCount(): Promise<number> {
    const query = `
      MATCH (u:User)
      RETURN count(u) AS count
    `;

    const result = await this.neo4jService.executeQuery(query, {});
    
    return this.extractNumber(result.records[0].get('count'));
  }

  /**
   * Get users who follow the specified user
   * 
   * @param screenName - User's screen name
   * @param limit - Maximum number of followers to return
   * @returns Array of follower users
   */
  async getFollowers(screenName: string, limit: number = 20): Promise<User[]> {
    const query = `
      MATCH (follower:User)-[:FOLLOWS]->(user:User {screen_name: $screenName})
      RETURN follower
      ORDER BY follower.followers DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, {
      screenName,
      limit: neo4j.int(limit),
    });

    return result.records.map((record) =>
      this.mapNodeToUser(record.get('follower')),
    );
  }

  /**
   * Get users that the specified user follows
   * 
   * @param screenName - User's screen name
   * @param limit - Maximum number of following to return
   * @returns Array of users being followed
   */
  async getFollowing(screenName: string, limit: number = 20): Promise<User[]> {
    const query = `
      MATCH (user:User {screen_name: $screenName})-[:FOLLOWS]->(following:User)
      RETURN following
      ORDER BY following.followers DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, {
      screenName,
      limit: neo4j.int(limit),
    });

    return result.records.map((record) =>
      this.mapNodeToUser(record.get('following')),
    );
  }

  /**
   * Helper: Map Neo4j node to User type
   * Handles both node objects and plain objects
   */
  private mapNodeToUser(node: any): User {
    // Handle Neo4j node object
    const props = node.properties || node;

    return {
      screen_name: props.screen_name,
      name: props.name,
      followers: this.extractNumber(props.followers),
      following: this.extractNumber(props.following),
      profile_image_url: props.profile_image_url,
      location: props.location,
      url: props.url,
    };
  }

  /**
   * Helper: Extract number from Neo4j Integer or number
   * Neo4j returns Integer objects that need conversion
   */
  private extractNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }
    
    // Handle Neo4j Integer object
    if (typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }
    
    // Handle regular numbers
    if (typeof value === 'number') {
      return value;
    }
    
    return 0;
  }
}

