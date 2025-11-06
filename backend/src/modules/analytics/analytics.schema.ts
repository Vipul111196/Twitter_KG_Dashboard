import { z } from 'zod';

/**
 * Zod Schemas for Analytics Module
 * Provides runtime validation and type safety for input parameters
 */

// Network data query parameters
export const GetNetworkDataSchema = z.object({
  limit: z.number().int().positive().max(500).default(100),
  minFollowers: z.number().int().nonnegative().default(0),
  minHashtagUsage: z.number().int().positive().default(5),
  minTweets: z.number().int().nonnegative().default(0),
});

// Type exports for TypeScript
export type GetNetworkDataInput = z.infer<typeof GetNetworkDataSchema>;
