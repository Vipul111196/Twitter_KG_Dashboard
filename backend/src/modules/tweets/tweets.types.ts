import { ObjectType, Field, Int, ID } from '@nestjs/graphql';
import { User } from '../users/users.types';

/**
 * Tweet GraphQL Type
 *
 * Represents a tweet in the graph database.
 * Maps to the Neo4j Tweet node properties.
 */
@ObjectType({ description: 'Twitter tweet/post' })
export class Tweet {
  @Field(() => ID, { description: 'Unique tweet ID' })
  id: string;

  @Field({ description: 'Tweet ID as string' })
  id_str: string;

  @Field({ description: 'Tweet text content' })
  text: string;

  @Field({ description: 'Creation timestamp', nullable: true })
  created_at?: string;

  @Field(() => Int, { description: 'Number of favorites/likes', nullable: true })
  favorites?: number;

  @Field({ description: 'Import method', nullable: true })
  import_method?: string;
}

/**
 * Hashtag GraphQL Type
 */
@ObjectType({ description: 'Twitter hashtag' })
export class Hashtag {
  @Field(() => ID, { description: 'Hashtag name (without #)' })
  name: string;
}

/**
 * Tweet with author - resolved relationship
 */
@ObjectType({ description: 'Tweet with author information' })
export class TweetWithAuthor extends Tweet {
  @Field(() => User, { description: 'User who posted the tweet', nullable: true })
  author?: User;

  @Field(() => [Hashtag], { description: 'Hashtags used in tweet', nullable: true })
  hashtags?: Hashtag[];
}

