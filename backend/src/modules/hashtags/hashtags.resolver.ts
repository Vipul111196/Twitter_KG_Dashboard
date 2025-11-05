import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { HashtagsService } from './hashtags.service';
import { HashtagStats } from './hashtags.types';
import { Hashtag } from '../tweets/tweets.types';

@Resolver(() => Hashtag)
export class HashtagsResolver {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @Query(() => Hashtag, {
    nullable: true,
    description: 'Get hashtag by name',
  })
  async hashtag(
    @Args('name', { type: () => String }) name: string,
  ): Promise<Hashtag | null> {
    return this.hashtagsService.getHashtagByName(name);
  }

  @Query(() => [HashtagStats], {
    description: 'Get trending hashtags with usage counts',
  })
  async trendingHashtags(
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number = 10,
  ): Promise<HashtagStats[]> {
    return this.hashtagsService.getTrendingHashtags(limit);
  }

  @Query(() => Int, {
    description: 'Get total number of hashtags',
  })
  async totalHashtags(): Promise<number> {
    return this.hashtagsService.getTotalHashtagCount();
  }
}
