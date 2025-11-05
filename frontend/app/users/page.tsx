'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Search, Users as UsersIcon, Filter, ArrowUpDown } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { UserDetailModal } from '@/components/modals/user-detail-modal';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { gql } from '@apollo/client';
import type { User, UsersByMinFollowersResponse, TopUsersByTweetsResponse, SearchUsersResponse } from '@/lib/types';

/**
 * Users Page
 * 
 * Search and browse Twitter users from the Neo4j database.
 * Shows user profiles with follower counts and profile images.
 * Includes minimum followers filter and click-to-view-details.
 */

const GET_USERS_BY_MIN_FOLLOWERS = gql`
  query GetUsersByMinFollowers($minFollowers: Int!, $limit: Int = 30) {
    usersByMinFollowers(minFollowers: $minFollowers, limit: $limit) {
      screen_name
      name
      followers
      following
      profile_image_url
    }
  }
`;

const GET_TOP_USERS_BY_TWEETS = gql`
  query GetTopUsersByTweets($limit: Int = 30) {
    topUsersByTweets(limit: $limit) {
      screen_name
      name
      followers
      following
      profile_image_url
    }
  }
`;

const SEARCH_USERS = gql`
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

type SortOption = 'followers' | 'tweets';

export default function UsersPage() {
  type UserScreenName = string;
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [minFollowers, setMinFollowers] = useState(0);
  const [sortBy, setSortBy] = useState<SortOption>('followers');
  const [selectedUser, setSelectedUser] = useState<UserScreenName | null>(null);

  // Query for users by followers
  const { data: followerData, loading: followerLoading, error: followerError } = useQuery<UsersByMinFollowersResponse>(
    GET_USERS_BY_MIN_FOLLOWERS,
    {
      variables: { minFollowers, limit: 30 },
      skip: !!debouncedQuery || sortBy === 'tweets',
    }
  );

  // Query for users by tweet count
  const { data: tweetData, loading: tweetLoading, error: tweetError } = useQuery<TopUsersByTweetsResponse>(
    GET_TOP_USERS_BY_TWEETS,
    {
      variables: { limit: 30 },
      skip: !!debouncedQuery || sortBy === 'followers',
    }
  );

  // Query for search results
  const { data: searchData, loading: searchLoading, error: searchError } = useQuery<SearchUsersResponse>(
    SEARCH_USERS,
    {
      variables: { query: debouncedQuery, limit: 30 },
      skip: !debouncedQuery,
    }
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Determine which data to show based on search or sort
  const users = useMemo(() => {
    if (debouncedQuery) {
      return searchData?.searchUsers || [];
    }
    if (sortBy === 'tweets') {
      return tweetData?.topUsersByTweets || [];
    }
    return followerData?.usersByMinFollowers || [];
  }, [debouncedQuery, searchData, sortBy, tweetData, followerData]);

  const loading = debouncedQuery ? searchLoading : (sortBy === 'tweets' ? tweetLoading : followerLoading);
  const error = debouncedQuery ? searchError : (sortBy === 'tweets' ? tweetError : followerError);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UsersIcon className="h-8 w-8" />
            Users
          </h1>
          <p className="text-muted-foreground mt-2">
            Search and explore Twitter users
          </p>
        </div>

        {/* Search Bar & Filters */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users by name or @username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Filters & Sorting */}
            {!searchQuery && (
              <div className="pt-4 border-t space-y-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Filters & Sorting</span>
                </div>

                {/* Sort Dropdown */}
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background"
                  >
                    <option value="followers">Most Followers</option>
                    <option value="tweets">Most Tweets</option>
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sort users by different criteria
                  </p>
                </div>

                {/* Min Followers Filter - Only show when sorting by followers */}
                {sortBy === 'followers' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Minimum Followers: {minFollowers.toLocaleString()}
                    </label>
                    <Slider
                      value={[minFollowers]}
                      onValueChange={(value) => setMinFollowers(value[0])}
                      min={0}
                      max={50000}
                      step={1}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Filter users by minimum follower count (0 = all users)
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Users List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-24" />
                </Card>
              ))}
            </>
          ) : error ? (
            <Card className="p-6 md:col-span-2 lg:col-span-3">
              <p className="text-destructive">Error loading users: {error.message}</p>
            </Card>
          ) : !users || users.length === 0 ? (
            <Card className="p-6 md:col-span-2 lg:col-span-3">
              <p className="text-muted-foreground text-center">
                {searchQuery ? 'No users found. Try a different search term.' : 'No users found with the selected filters.'}
              </p>
            </Card>
          ) : (
            users?.map((user: User) => (
              <Card 
                key={user.screen_name} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer hover:border-primary"
                onClick={() => setSelectedUser(user.screen_name)}
              >
                <div className="flex items-start gap-4">
                  {/* Profile Image */}
                  <div className="rounded-full bg-primary/10 w-16 h-16 flex items-center justify-center flex-shrink-0">
                      <UsersIcon className="h-8 w-8 text-primary" />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{user.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      @{user.screen_name}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex gap-4 mt-3 text-sm">
                      <div>
                        <span className="font-semibold">{user.followers?.toLocaleString() || 0}</span>
                        <span className="text-muted-foreground ml-1">followers</span>
                      </div>
                      <div>
                        <span className="font-semibold">{user.following?.toLocaleString() || 0}</span>
                        <span className="text-muted-foreground ml-1">following</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <UserDetailModal
        screenName={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </DashboardLayout>
  );
}

