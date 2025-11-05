import { z } from 'zod';

/**
 * Zod Schemas for Users Module
 *
 * These schemas provide runtime validation and type safety.
 * They replace traditional DTOs with a more functional approach.
 */

// User query parameter schemas
export const GetUserByScreenNameSchema = z.object({
  screenName: z.string().min(1, 'Screen name is required'),
});

export const SearchUsersSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  limit: z.number().int().positive().max(100).default(10),
});

export const GetUsersByFollowersSchema = z.object({
  minFollowers: z.number().int().nonnegative().default(0),
  limit: z.number().int().positive().max(100).default(10),
});

// Type exports for TypeScript
export type GetUserByScreenNameInput = z.infer<
  typeof GetUserByScreenNameSchema
>;
export type SearchUsersInput = z.infer<typeof SearchUsersSchema>;
export type GetUsersByFollowersInput = z.infer<
  typeof GetUsersByFollowersSchema
>;
