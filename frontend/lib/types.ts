/**
 * Shared TypeScript types for the application
 * These match the GraphQL schema types from the backend
 */

export interface User {
  screen_name: string;
  name: string;
  followers: number;
  following: number;
  profile_image_url?: string;
  location?: string;
  url?: string;
}

export interface Tweet {
  id: string;
  id_str: string;
  text: string;
  created_at?: string;
  favorites?: number;
  import_method?: string;
  author?: User;
}

export interface Hashtag {
  name: string;
  usageCount?: number;
}

export interface NetworkNode {
  id: string;
  label: string;
  type: 'user' | 'tweet' | 'hashtag';
  size?: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: string;
}

export interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

export interface DashboardStats {
  totalUsers: number;
  totalTweets: number;
  totalHashtags: number;
  totalRelationships: number;
}

// Cytoscape event type
export interface CytoscapeEvent {
  target: {
    id: () => string;
    data: (key?: string) => unknown;
    style: (property: string, value?: string) => void;
  };
}

// GraphQL Response Types
export interface DashboardStatsResponse {
  dashboardStats: DashboardStats;
}

export interface TrendingHashtagsResponse {
  trendingHashtags: Hashtag[];
}

export interface TopUsersByTweetsResponse {
  topUsersByTweets: User[];
}

export interface SearchUsersResponse {
  searchUsers: User[];
}

export interface UsersByMinFollowersResponse {
  usersByMinFollowers: User[];
}

export interface TweetsByHashtagResponse {
  tweetsByHashtag: Tweet[];
}

export interface HashtagResponse {
  hashtag: Hashtag;
}

export interface TweetResponse {
  tweet: Tweet;
}

export interface UserResponse {
  user: User;
}

export interface TweetsByUserResponse {
  tweetsByUser: Tweet[];
}

export interface UserStatsResponse {
  userStats: {
    tweetCount: number;
    followerCount: number;
    followingCount: number;
    uniqueHashtagsUsed: number;
  };
}

export interface NetworkDataResponse {
  networkData: NetworkData;
}

