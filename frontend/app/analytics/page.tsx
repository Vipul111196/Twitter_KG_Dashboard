'use client';

import { useQuery } from '@apollo/client/react';
import { BarChart3, TrendingUp, Users, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { StatsCard } from '@/components/dashboard/stats-card';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GET_DASHBOARD_STATS, GET_TRENDING_HASHTAGS } from '@/lib/graphql/queries';

/**
 * Analytics Page
 * 
 * Advanced analytics and insights about the Twitter network.
 * Shows detailed statistics and trends.
 */

export default function AnalyticsPage() {
  const { data: statsData, loading: statsLoading } = useQuery(GET_DASHBOARD_STATS);
  const { data: hashtagsData, loading: hashtagsLoading } = useQuery(GET_TRENDING_HASHTAGS, {
    variables: { limit: 10 },
  });

  // Calculate some derived metrics
  const avgTweetsPerUser = statsData?.dashboardStats?.totalTweets && statsData?.dashboardStats?.totalUsers
    ? (statsData.dashboardStats.totalTweets / statsData.dashboardStats.totalUsers).toFixed(2)
    : 0;

  const avgHashtagsPerTweet = statsData?.dashboardStats?.totalHashtags && statsData?.dashboardStats?.totalTweets
    ? (statsData.dashboardStats.totalHashtags / statsData.dashboardStats.totalTweets).toFixed(2)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Deep insights into Twitter network data
          </p>
        </div>

        {/* Primary Stats */}
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
              />
              <StatsCard
                title="Total Tweets"
                value={statsData?.dashboardStats?.totalTweets || 0}
                icon={MessageSquare}
              />
              <StatsCard
                title="Avg Tweets/User"
                value={avgTweetsPerUser}
                icon={TrendingUp}
              />
              <StatsCard
                title="Avg Hashtags/Tweet"
                value={avgHashtagsPerTweet}
                icon={BarChart3}
              />
            </>
          )}
        </div>

        {/* Network Metrics */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Network Metrics</h2>
          {statsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Relationships</p>
                <p className="text-2xl font-bold mt-2">
                  {statsData?.dashboardStats?.totalRelationships?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Unique Hashtags</p>
                <p className="text-2xl font-bold mt-2">
                  {statsData?.dashboardStats?.totalHashtags?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Network Density</p>
                <p className="text-2xl font-bold mt-2">
                  {statsData?.dashboardStats?.totalRelationships && statsData?.dashboardStats?.totalUsers
                    ? ((statsData.dashboardStats.totalRelationships / (statsData.dashboardStats.totalUsers * (statsData.dashboardStats.totalUsers - 1))) * 100).toFixed(2)
                    : 0}%
                </p>
              </div>
            </div>
          )}
        </Card>

        {/* Top Hashtags Analysis */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Top Hashtags Analysis</h2>
          {hashtagsLoading ? (
            <div className="space-y-3">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-8" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {hashtagsData?.trendingHashtags?.map((hashtag: any, index: number) => {
                const maxUsage = hashtagsData.trendingHashtags[0]?.usageCount || 1;
                const percentage = (hashtag.usageCount / maxUsage) * 100;
                
                return (
                  <div key={hashtag.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <span className="font-medium">#{hashtag.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {hashtag.usageCount.toLocaleString()} tweets
                      </span>
                    </div>
                    <div className="w-full bg-accent rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

