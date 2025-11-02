import { Injectable } from '@nestjs/common';
import neo4j from 'neo4j-driver';
import { Neo4jService } from '../../database/neo4j.service';
import { Tweet, TweetWithAuthor, Hashtag } from './tweets.types';
import { User } from '../users/users.types';

/**
 * Tweets Service
 *
 * Handles all tweet-related database queries using Cypher.
 * Uses real Twitter v2 schema with POSTS and TAGS relationships.
 */
@Injectable()
export class TweetsService {
  constructor(private readonly neo4jService: Neo4jService) {}

  /**
   * Get tweet by ID
   */
  async getTweetById(id: string): Promise<Tweet | null> {
    const query = `
      MATCH (t:Tweet {id_str: $id})
      RETURN t
    `;

    const result = await this.neo4jService.executeQuery(query, { id });

    if (result.records.length === 0) {
      return null;
    }

    return this.mapNodeToTweet(result.records[0].get('t'));
  }

  /**
   * Get tweets by user screen name
   */
  async getTweetsByUser(screenName: string, limit: number = 20): Promise<Tweet[]> {
    const query = `
      MATCH (u:User {screen_name: $screenName})-[:POSTS]->(t:Tweet)
      RETURN t
      ORDER BY t.created_at DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, {
      screenName,
      limit: neo4j.int(limit),
    });

    return result.records.map((record) =>
      this.mapNodeToTweet(record.get('t')),
    );
  }

  /**
   * Get tweets by hashtag
   */
  async getTweetsByHashtag(hashtagName: string, limit: number = 20): Promise<Tweet[]> {
    const query = `
      MATCH (t:Tweet)-[:TAGS]->(h:Hashtag {name: $hashtagName})
      RETURN t
      ORDER BY t.created_at DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, {
      hashtagName,
      limit: neo4j.int(limit),
    });

    return result.records.map((record) =>
      this.mapNodeToTweet(record.get('t')),
    );
  }

  /**
   * Search tweets by text content
   */
  async searchTweets(query: string, limit: number = 20): Promise<Tweet[]> {
    const cypherQuery = `
      MATCH (t:Tweet)
      WHERE toLower(t.text) CONTAINS toLower($query)
      RETURN t
      ORDER BY t.created_at DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(cypherQuery, {
      query,
      limit: neo4j.int(limit),
    });

    return result.records.map((record) =>
      this.mapNodeToTweet(record.get('t')),
    );
  }

  /**
   * Get recent tweets
   */
  async getRecentTweets(limit: number = 20): Promise<Tweet[]> {
    const query = `
      MATCH (t:Tweet)
      WHERE t.created_at IS NOT NULL
      RETURN t
      ORDER BY t.created_at DESC
      LIMIT $limit
    `;

    const result = await this.neo4jService.executeQuery(query, { limit: neo4j.int(limit) });

    return result.records.map((record) =>
      this.mapNodeToTweet(record.get('t')),
    );
  }

  /**
   * Get tweet with full relationships (author, hashtags)
   */
  async getTweetWithRelationships(id: string): Promise<TweetWithAuthor | null> {
    const query = `
      MATCH (t:Tweet {id_str: $id})
      OPTIONAL MATCH (u:User)-[:POSTS]->(t)
      OPTIONAL MATCH (t)-[:TAGS]->(h:Hashtag)
      RETURN t, u AS author, collect(DISTINCT h) AS hashtags
    `;

    const result = await this.neo4jService.executeQuery(query, { id });

    if (result.records.length === 0) {
      return null;
    }

    const record = result.records[0];
    const tweet = this.mapNodeToTweet(record.get('t'));
    const authorNode = record.get('author');
    const hashtagNodes = record.get('hashtags');

    // Map author if exists
    const author = authorNode ? this.mapNodeToUser(authorNode) : undefined;

    // Map hashtags
    const hashtags = hashtagNodes
      .filter((h: any) => h !== null)
      .map((h: any) => this.mapNodeToHashtag(h));

    return {
      ...tweet,
      author,
      hashtags,
    };
  }

  /**
   * Get total tweet count
   */
  async getTotalTweetCount(): Promise<number> {
    const query = `
      MATCH (t:Tweet)
      RETURN count(t) AS count
    `;

    const result = await this.neo4jService.executeQuery(query, {});
    return this.extractNumber(result.records[0].get('count'));
  }

  /**
   * Helper: Map Neo4j node to Tweet
   */
  private mapNodeToTweet(node: any): Tweet {
    const props = node.properties || node;

    // Handle ID - could be string, number, or Neo4j Integer
    let id = props.id_str; // Default to id_str
    if (props.id) {
      if (typeof props.id === 'string') {
        id = props.id;
      } else if (typeof props.id === 'number') {
        id = props.id.toString();
      } else if (typeof props.id === 'object' && 'toString' in props.id) {
        // Neo4j Integer object
        id = props.id.toString();
      }
    }

    return {
      id,
      id_str: props.id_str,
      text: props.text,
      created_at: props.created_at
        ? new Date(props.created_at).toISOString()
        : undefined,
      favorites: this.extractNumber(props.favorites),
      import_method: props.import_method,
    };
  }

  /**
   * Helper: Map Neo4j node to User
   */
  private mapNodeToUser(node: any): User {
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
   * Helper: Map Neo4j node to Hashtag
   */
  private mapNodeToHashtag(node: any): Hashtag {
    const props = node.properties || node;

    return {
      name: props.name,
    };
  }

  /**
   * Helper: Extract number from Neo4j Integer or number
   */
  private extractNumber(value: any): number {
    if (value === null || value === undefined) {
      return 0;
    }

    if (typeof value === 'object' && 'toNumber' in value) {
      return value.toNumber();
    }

    if (typeof value === 'number') {
      return value;
    }

    return 0;
  }
}

