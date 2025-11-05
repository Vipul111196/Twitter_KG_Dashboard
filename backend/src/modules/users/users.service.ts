import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../../database/neo4j.service';
import {
  extractNumber,
  extractString,
  extractNodeProperties,
  getRecordField,
  Neo4jNode,
  Neo4jNumeric,
} from '../../database/neo4j.types';
import { User, UserStats } from './users.types';

// Define expected user properties from Neo4j
interface UserNodeProperties {
  screen_name: string;
  name?: string;
  followers?: Neo4jNumeric;
  following?: Neo4jNumeric;
  profile_image_url?: string;
  location?: string;
  url?: string;
}

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

    const userNode = getRecordField<Neo4jNode<UserNodeProperties>>(
      result.records[0],
      'u',
    );
    if (!userNode) return null;

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
      limit: neo4j.int(limit),
    });

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<UserNodeProperties>>(record, 'u');
        return node ? this.mapNodeToUser(node) : null;
      })
      .filter((user): user is User => user !== null);
  }

  /**
   * Get top users by number of tweets
   *
   * @param limit - Maximum results to return
   * @returns Array of users sorted by tweet count
   */
  async getTopUsersByTweets(limit: number = 10): Promise<User[]> {
    const query = `
      MATCH (u:User)-[:POSTS]->(t:Tweet)
      WITH u, count(t) as tweetCount
      RETURN u, tweetCount
      ORDER BY tweetCount DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, {
      limit: neo4j.int(limit),
    });

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<UserNodeProperties>>(record, 'u');
        return node ? this.mapNodeToUser(node) : null;
      })
      .filter((user): user is User => user !== null);
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
      minFollowers: neo4j.int(minFollowers),
      limit: neo4j.int(limit),
    });

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<UserNodeProperties>>(record, 'u');
        return node ? this.mapNodeToUser(node) : null;
      })
      .filter((user): user is User => user !== null);
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

    const result = await this.neo4jService.executeQuery(query, {
      limit: neo4j.int(limit),
    });

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<UserNodeProperties>>(record, 'u');
        return node ? this.mapNodeToUser(node) : null;
      })
      .filter((user): user is User => user !== null);
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

    return {
      tweetCount: extractNumber(getRecordField(record, 'tweetCount')),
      followerCount: extractNumber(getRecordField(record, 'followerCount')),
      followingCount: extractNumber(getRecordField(record, 'followingCount')),
      uniqueHashtagsUsed: extractNumber(
        getRecordField(record, 'uniqueHashtagsUsed'),
      ),
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

    if (result.records.length === 0) return 0;

    return extractNumber(getRecordField(result.records[0], 'count'));
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

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<UserNodeProperties>>(
          record,
          'follower',
        );
        return node ? this.mapNodeToUser(node) : null;
      })
      .filter((user): user is User => user !== null);
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

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<UserNodeProperties>>(
          record,
          'following',
        );
        return node ? this.mapNodeToUser(node) : null;
      })
      .filter((user): user is User => user !== null);
  }

  /**
   * Helper: Map Neo4j node to User type
   */
  private mapNodeToUser(node: Neo4jNode<UserNodeProperties>): User {
    const props = extractNodeProperties<UserNodeProperties>(node);
    if (!props) {
      // Fallback if properties extraction fails
      return {
        screen_name: '',
        name: '',
        followers: 0,
        following: 0,
        profile_image_url: undefined,
        location: undefined,
        url: undefined,
      };
    }

    return {
      screen_name: extractString(props.screen_name),
      name: extractString(props.name),
      followers: extractNumber(props.followers),
      following: extractNumber(props.following),
      profile_image_url: extractString(props.profile_image_url) || undefined,
      location: extractString(props.location) || undefined,
      url: extractString(props.url) || undefined,
    };
  }
}
