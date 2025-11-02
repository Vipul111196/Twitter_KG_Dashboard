import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { TweetsService } from './tweets.service';
import { Tweet, TweetWithAuthor } from './tweets.types';

/**
 * Tweets GraphQL Resolver
 *
 * Exposes tweet-related queries via GraphQL API.
 */
@Resolver(() => Tweet)
export class TweetsResolver {
  constructor(private readonly tweetsService: TweetsService) {}

  /**
   * Get single tweet with relationships
   */
  @Query(() => TweetWithAuthor, {
    nullable: true,
    description: 'Get tweet by ID with author and hashtags',
  })
  async tweet(
    @Args('id', { type: () => String, description: 'Tweet ID' }) id: string,
  ): Promise<TweetWithAuthor | null> {
    return this.tweetsService.getTweetWithRelationships(id);
  }

  /**
   * Get tweets by user
   */
  @Query(() => [Tweet], {
    description: 'Get tweets posted by a user',
  })
  async tweetsByUser(
    @Args('screenName', { type: () => String, description: 'User screen name' })
    screenName: string,
    @Args('limit', {
      type: () => Int,
      defaultValue: 20,
      description: 'Maximum results to return',
    })
    limit: number = 20,
  ): Promise<Tweet[]> {
    return this.tweetsService.getTweetsByUser(screenName, limit);
  }

  /**
   * Get tweets by hashtag
   */
  @Query(() => [Tweet], {
    description: 'Get tweets containing a specific hashtag',
  })
  async tweetsByHashtag(
    @Args('hashtagName', { type: () => String, description: 'Hashtag name' })
    hashtagName: string,
    @Args('limit', {
      type: () => Int,
      defaultValue: 20,
      description: 'Maximum results to return',
    })
    limit: number = 20,
  ): Promise<Tweet[]> {
    return this.tweetsService.getTweetsByHashtag(hashtagName, limit);
  }

  /**
   * Search tweets by text content
   */
  @Query(() => [Tweet], {
    description: 'Search tweets by text content',
  })
  async searchTweets(
    @Args('query', { type: () => String, description: 'Search query' })
    query: string,
    @Args('limit', {
      type: () => Int,
      defaultValue: 20,
      description: 'Maximum results to return',
    })
    limit: number = 20,
  ): Promise<Tweet[]> {
    return this.tweetsService.searchTweets(query, limit);
  }

  /**
   * Get recent tweets
   */
  @Query(() => [Tweet], {
    description: 'Get most recent tweets',
  })
  async recentTweets(
    @Args('limit', {
      type: () => Int,
      defaultValue: 20,
      description: 'Maximum results to return',
    })
    limit: number = 20,
  ): Promise<Tweet[]> {
    return this.tweetsService.getRecentTweets(limit);
  }

  /**
   * Get total tweet count
   */
  @Query(() => Int, {
    description: 'Get total number of tweets',
  })
  async totalTweets(): Promise<number> {
    return this.tweetsService.getTotalTweetCount();
  }
}

