import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType({ description: 'Hashtag with usage statistics' })
export class HashtagStats {
  @Field(() => ID, { description: 'Hashtag name' })
  name: string;

  @Field(() => Int, { description: 'Number of tweets using this hashtag' })
  usageCount: number;
}

