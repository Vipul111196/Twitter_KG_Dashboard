import { z } from 'zod';

export const GetHashtagByNameSchema = z.object({
  name: z.string().min(1, 'Hashtag name is required'),
});

export const GetTrendingHashtagsSchema = z.object({
  limit: z.number().int().positive().max(100).default(10),
});

export type GetHashtagByNameInput = z.infer<typeof GetHashtagByNameSchema>;
export type GetTrendingHashtagsInput = z.infer<
  typeof GetTrendingHashtagsSchema
>;
