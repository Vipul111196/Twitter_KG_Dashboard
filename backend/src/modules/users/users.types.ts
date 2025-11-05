import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

/**
 * User GraphQL Type
 *
 * Represents a Twitter user in the graph database.
 * Maps to the Neo4j User node properties.
 */
@ObjectType({ description: 'Twitter user' })
export class User {
  @Field(() => ID, { description: 'Unique screen name (@username)' })
  screen_name: string;

  @Field({ description: 'Display name' })
  name: string;

  @Field(() => Int, { description: 'Number of followers', nullable: true })
  followers?: number;

  @Field(() => Int, {
    description: 'Number of accounts followed',
    nullable: true,
  })
  following?: number;

  @Field({ description: 'Profile image URL', nullable: true })
  profile_image_url?: string;

  @Field({ description: 'User location', nullable: true })
  location?: string;

  @Field({ description: 'Profile URL', nullable: true })
  url?: string;
}

/**
 * User Statistics Type
 *
 * Aggregate statistics about a user's activity
 */
@ObjectType({ description: 'User activity statistics' })
export class UserStats {
  @Field(() => Int, { description: 'Total tweets posted' })
  tweetCount: number;

  @Field(() => Int, { description: 'Total followers' })
  followerCount: number;

  @Field(() => Int, { description: 'Total following' })
  followingCount: number;

  @Field(() => Int, { description: 'Unique hashtags used' })
  uniqueHashtagsUsed: number;
}
