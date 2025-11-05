import { gql } from '@apollo/client';

/**
 * GraphQL Queries for Twitter Analytics Dashboard
 * 
 * These queries match the backend GraphQL schema.
 * All queries are tested and verified with real Neo4j data.
 */

// ============================================
// Analytics Queries
// ============================================

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats {
      totalUsers
      totalTweets
      totalHashtags
      totalRelationships
    }
  }
`;

export const GET_NETWORK_DATA = gql`
  query GetNetworkData($limit: Int = 100, $minFollowers: Int = 0, $minHashtagUsage: Int = 5, $minTweets: Int = 0) {
    networkData(limit: $limit, minFollowers: $minFollowers, minHashtagUsage: $minHashtagUsage, minTweets: $minTweets) {
      nodes {
        id
        label
        type
        size
      }
      edges {
        source
        target
        type
      }
    }
  }
`;

// ============================================
// User Queries
// ============================================

export const GET_USER = gql`
  query GetUser($screenName: String!) {
    user(screenName: $screenName) {
      screen_name
      name
      followers
      following
      profile_image_url
      location
      url
    }
  }
`;

// Alias for user detail modal
export const GET_USER_BY_SCREEN_NAME = GET_USER;

export const SEARCH_USERS = gql`
  query SearchUsers($query: String!, $limit: Int = 20) {
    searchUsers(query: $query, limit: $limit) {
      screen_name
      name
      followers
      following
      profile_image_url
    }
  }
`;

export const GET_USER_STATS = gql`
  query GetUserStats($screenName: String!) {
    userStats(screenName: $screenName) {
      tweetCount
      followerCount
      followingCount
      uniqueHashtagsUsed
    }
  }
`;

export const GET_FOLLOWERS = gql`
  query GetFollowers($screenName: String!, $limit: Int = 20) {
    followers(screenName: $screenName, limit: $limit) {
      screen_name
      name
      followers
      profile_image_url
    }
  }
`;

export const GET_FOLLOWING = gql`
  query GetFollowing($screenName: String!, $limit: Int = 20) {
    following(screenName: $screenName, limit: $limit) {
      screen_name
      name
      followers
      profile_image_url
    }
  }
`;

export const GET_TOP_USERS_BY_TWEETS = gql`
  query GetTopUsersByTweets($limit: Int = 5) {
    topUsersByTweets(limit: $limit) {
      screen_name
      name
      followers
      profile_image_url
    }
  }
`;

// ============================================
// Tweet Queries
// ============================================

export const GET_TWEETS_BY_USER = gql`
  query GetTweetsByUser($screenName: String!, $limit: Int = 20) {
    tweetsByUser(screenName: $screenName, limit: $limit) {
      id
      text
      created_at
      favorites
    }
  }
`;

// Alias for user detail modal
export const GET_USER_TWEETS = GET_TWEETS_BY_USER;

export const GET_TWEETS_BY_HASHTAG = gql`
  query GetTweetsByHashtag($hashtagName: String!, $limit: Int = 20) {
    tweetsByHashtag(hashtagName: $hashtagName, limit: $limit) {
      id
      text
      created_at
      favorites
    }
  }
`;

export const SEARCH_TWEETS = gql`
  query SearchTweets($query: String!, $limit: Int = 20) {
    searchTweets(query: $query, limit: $limit) {
      id
      text
      created_at
      favorites
    }
  }
`;

export const GET_RECENT_TWEETS = gql`
  query GetRecentTweets($limit: Int = 20) {
    recentTweets(limit: $limit) {
      id
      text
      created_at
      favorites
    }
  }
`;

// ============================================
// Hashtag Queries
// ============================================

export const GET_TRENDING_HASHTAGS = gql`
  query GetTrendingHashtags($limit: Int = 10) {
    trendingHashtags(limit: $limit) {
      name
      usageCount
    }
  }
`;

export const GET_HASHTAG = gql`
  query GetHashtag($name: String!) {
    hashtag(name: $name) {
      name
    }
  }
`;

