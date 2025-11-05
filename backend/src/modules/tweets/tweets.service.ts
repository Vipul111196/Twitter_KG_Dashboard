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
  Neo4jValue,
} from '../../database/neo4j.types';
import { Tweet, TweetWithAuthor, Hashtag } from './tweets.types';
import { User } from '../users/users.types';

// Define expected node properties from Neo4j
interface TweetNodeProperties {
  id?: Neo4jValue;
  id_str?: string;
  text?: string;
  created_at?: string;
  favorites?: Neo4jNumeric;
  import_method?: string;
}

interface UserNodeProperties {
  screen_name: string;
  name?: string;
  followers?: Neo4jNumeric;
  following?: Neo4jNumeric;
  profile_image_url?: string;
  location?: string;
  url?: string;
}

interface HashtagNodeProperties {
  name: string;
}

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

    const tweetNode = getRecordField<Neo4jNode<TweetNodeProperties>>(
      result.records[0],
      't',
    );
    if (!tweetNode) return null;

    return this.mapNodeToTweet(tweetNode);
  }

  /**
   * Get tweets by user screen name
   */
  async getTweetsByUser(
    screenName: string,
    limit: number = 20,
  ): Promise<Tweet[]> {
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

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<TweetNodeProperties>>(
          record,
          't',
        );
        return node ? this.mapNodeToTweet(node) : null;
      })
      .filter((tweet): tweet is Tweet => tweet !== null);
  }

  /**
   * Get tweets by hashtag
   */
  async getTweetsByHashtag(
    hashtagName: string,
    limit: number = 20,
  ): Promise<Tweet[]> {
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

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<TweetNodeProperties>>(
          record,
          't',
        );
        return node ? this.mapNodeToTweet(node) : null;
      })
      .filter((tweet): tweet is Tweet => tweet !== null);
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

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<TweetNodeProperties>>(
          record,
          't',
        );
        return node ? this.mapNodeToTweet(node) : null;
      })
      .filter((tweet): tweet is Tweet => tweet !== null);
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

    const result = await this.neo4jService.executeQuery(query, {
      limit: neo4j.int(limit),
    });

    return result.records
      .map((record) => {
        const node = getRecordField<Neo4jNode<TweetNodeProperties>>(
          record,
          't',
        );
        return node ? this.mapNodeToTweet(node) : null;
      })
      .filter((tweet): tweet is Tweet => tweet !== null);
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
    const tweetNode = getRecordField<Neo4jNode<TweetNodeProperties>>(
      record,
      't',
    );
    if (!tweetNode) return null;

    const tweet = this.mapNodeToTweet(tweetNode);
    const authorNode = getRecordField<Neo4jNode<UserNodeProperties>>(
      record,
      'author',
    );
    const hashtagNodes = getRecordField<Neo4jNode<HashtagNodeProperties>[]>(
      record,
      'hashtags',
    );

    // Map author if exists
    const author = authorNode ? this.mapNodeToUser(authorNode) : undefined;

    // Map hashtags - filter out null values
    const hashtags =
      hashtagNodes
        ?.filter((h): h is Neo4jNode<HashtagNodeProperties> => h !== null)
        .map((h) => this.mapNodeToHashtag(h)) ?? [];

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

    if (result.records.length === 0) return 0;

    return extractNumber(getRecordField(result.records[0], 'count'));
  }

  /**
   * Helper: Map Neo4j node to Tweet
   */
  private mapNodeToTweet(node: Neo4jNode<TweetNodeProperties>): Tweet {
    const props = extractNodeProperties<TweetNodeProperties>(node);
    if (!props) {
      return {
        id: '',
        id_str: '',
        text: '',
        created_at: undefined,
        favorites: 0,
        import_method: undefined,
      };
    }

    const id_str = extractString(props.id_str);
    const id = id_str || extractString(props.id);

    // Safely handle created_at date conversion
    let created_at: string | undefined = undefined;
    if (props.created_at) {
      const dateStr = extractString(props.created_at);
      if (dateStr) {
        try {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            created_at = date.toISOString();
          }
        } catch {
          // Invalid date, leave as undefined
        }
      }
    }

    return {
      id,
      id_str,
      text: extractString(props.text),
      created_at,
      favorites: extractNumber(props.favorites),
      import_method: extractString(props.import_method) || undefined,
    };
  }

  /**
   * Helper: Map Neo4j node to User
   */
  private mapNodeToUser(node: Neo4jNode<UserNodeProperties>): User {
    const props = extractNodeProperties<UserNodeProperties>(node);
    if (!props) {
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

  /**
   * Helper: Map Neo4j node to Hashtag
   */
  private mapNodeToHashtag(node: Neo4jNode<HashtagNodeProperties>): Hashtag {
    const props = extractNodeProperties<HashtagNodeProperties>(node);
    if (!props) {
      return {
        name: '',
      };
    }

    return {
      name: extractString(props.name),
    };
  }
}
