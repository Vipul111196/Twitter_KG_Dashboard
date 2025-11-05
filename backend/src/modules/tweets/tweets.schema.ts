import { z } from 'zod';

/**
 * Zod Schemas for Tweets Module
 */

export const GetTweetsByUserSchema = z.object({
  screenName: z.string().min(1, 'Screen name is required'),
  limit: z.number().int().positive().max(100).default(20),
});

export const GetTweetsByHashtagSchema = z.object({
  hashtagName: z.string().min(1, 'Hashtag name is required'),
  limit: z.number().int().positive().max(100).default(20),
});

export const SearchTweetsSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().int().positive().max(100).default(20),
});

export const GetRecentTweetsSchema = z.object({
  limit: z.number().int().positive().max(100).default(20),
});

// Type exports
export type GetTweetsByUserInput = z.infer<typeof GetTweetsByUserSchema>;
export type GetTweetsByHashtagInput = z.infer<typeof GetTweetsByHashtagSchema>;
export type SearchTweetsInput = z.infer<typeof SearchTweetsSchema>;
export type GetRecentTweetsInput = z.infer<typeof GetRecentTweetsSchema>;
