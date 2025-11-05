'use client';

import { useQuery } from '@apollo/client/react';
import { Users, MessageSquare, Hash, Network } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { GET_DASHBOARD_STATS, GET_TRENDING_HASHTAGS, GET_TOP_USERS_BY_TWEETS } from '@/lib/graphql/queries';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStatsResponse, TrendingHashtagsResponse, TopUsersByTweetsResponse, Hashtag, User } from '@/lib/types';

/**
 * Dashboard Home Page
 * 
 * Displays overview with key statistics, trending hashtags, and top users by tweets.
 * Fetches real data from Neo4j via GraphQL backend.
 */

export default function DashboardPage() {
  const { data: statsData, loading: statsLoading } = useQuery<DashboardStatsResponse>(GET_DASHBOARD_STATS);
  const { data: hashtagsData, loading: hashtagsLoading } = useQuery<TrendingHashtagsResponse>(GET_TRENDING_HASHTAGS, {
    variables: { limit: 5 },
  });
  const { data: topUsersData, loading: topUsersLoading } = useQuery<TopUsersByTweetsResponse>(GET_TOP_USERS_BY_TWEETS, {
    variables: { limit: 5 },
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-2">
            Twitter network analytics powered by Neo4j
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statsLoading ? (
            <>
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-20" />
                </Card>
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total Users"
                value={statsData?.dashboardStats?.totalUsers || 0}
                icon={Users}
                description="Registered accounts"
              />
              <StatsCard
                title="Total Tweets"
                value={statsData?.dashboardStats?.totalTweets || 0}
                icon={MessageSquare}
                description="Published tweets"
              />
              <StatsCard
                title="Hashtags"
                value={statsData?.dashboardStats?.totalHashtags || 0}
                icon={Hash}
                description="Unique hashtags"
              />
              <StatsCard
                title="Relationships"
                value={statsData?.dashboardStats?.totalRelationships || 0}
                icon={Network}
                description="Network connections"
              />
            </>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Trending Hashtags */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Trending Hashtags</h2>
            {hashtagsLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-8" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {hashtagsData?.trendingHashtags?.map((hashtag: Hashtag, index: number) => (
                  <div key={hashtag.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <span className="font-medium">#{hashtag.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {hashtag.usageCount?.toLocaleString()} tweets
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Top Users by Tweets */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Top Users by Tweets</h2>
            {topUsersLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {topUsersData?.topUsersByTweets?.map((user: User, index: number) => (
                  <div key={user.screen_name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-medium">@{user.screen_name}</div>
                        <div className="text-sm text-muted-foreground">{user.name}</div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {user.followers.toLocaleString()} followers
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
