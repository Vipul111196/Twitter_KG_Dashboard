'use client';

import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { Network as NetworkIcon, Loader2, Filter } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { NetworkGraph } from '@/components/graph/network-graph';
import { UserDetailModal } from '@/components/modals/user-detail-modal';
import { TweetDetailModal } from '@/components/modals/tweet-detail-modal';
import { HashtagDetailModal } from '@/components/modals/hashtag-detail-modal';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { GET_NETWORK_DATA } from '@/lib/graphql/queries';

/**
 * Network Visualization Page
 * 
 * Interactive graph visualization of Twitter network data.
 * Shows users, tweets, and hashtags with their relationships.
 */

export default function NetworkPage() {
  const [nodeLimit, setNodeLimit] = useState(50);
  const [minFollowers, setMinFollowers] = useState(0);
  const [minHashtagUsage, setMinHashtagUsage] = useState(5);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedTweet, setSelectedTweet] = useState<string | null>(null);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);

  const { data, loading, error } = useQuery(GET_NETWORK_DATA, {
    variables: { 
      limit: nodeLimit,
      minFollowers: minFollowers,
      minHashtagUsage: minHashtagUsage,
    },
  });

  const handleNodeClick = (nodeId: string, nodeType: string) => {
    // Reset all selections
    setSelectedUser(null);
    setSelectedTweet(null);
    setSelectedHashtag(null);

    // Set appropriate selection based on node type
    if (nodeType === 'User') {
      setSelectedUser(nodeId);
    } else if (nodeType === 'Tweet') {
      setSelectedTweet(nodeId);
    } else if (nodeType === 'Hashtag') {
      setSelectedHashtag(nodeId);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <NetworkIcon className="h-8 w-8" />
            Network Visualization
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore connections between users, tweets, and hashtags
          </p>
        </div>

        {/* Controls & Filters */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Controls & Filters</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Node Limit */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Number of Nodes: {nodeLimit}
              </label>
              <Slider
                value={[nodeLimit]}
                onValueChange={(value) => setNodeLimit(value[0])}
                min={10}
                max={200}
                step={10}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Adjust the number of nodes to display
              </p>
            </div>

            {/* Min Followers Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Minimum Followers: {minFollowers.toLocaleString()}
              </label>
              <Slider
                value={[minFollowers]}
                onValueChange={(value) => setMinFollowers(value[0])}
                min={0}
                max={50000}
                step={1000}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Filter users by minimum follower count (0 = all users)
              </p>
            </div>

            {/* Min Hashtag Usage Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Hashtag Min Usage: {minHashtagUsage}
              </label>
              <Slider
                value={[minHashtagUsage]}
                onValueChange={(value) => setMinHashtagUsage(value[0])}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Filter hashtags by minimum usage count
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 text-sm mt-6 pt-6 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500" />
              <span>Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500" />
              <span>Tweets</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rotate-45" />
              <span>Hashtags</span>
            </div>
            <p className="text-xs text-muted-foreground ml-auto">
              💡 Click on any node to view details
            </p>
          </div>
        </Card>

        {/* Graph */}
        <Card className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Loading network data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-[600px]">
              <div className="text-center space-y-2">
                <p className="text-destructive font-semibold">Error loading network</p>
                <p className="text-sm text-muted-foreground">{error.message}</p>
              </div>
            </div>
          ) : data?.networkData ? (
            <NetworkGraph
              nodes={data.networkData.nodes || []}
              edges={data.networkData.edges || []}
              onNodeClick={handleNodeClick}
            />
          ) : (
            <div className="flex items-center justify-center h-[600px]">
              <p className="text-muted-foreground">No network data available</p>
            </div>
          )}
        </Card>

        {/* Stats */}
        {data?.networkData && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">Total Nodes</h3>
              <p className="text-3xl font-bold mt-2">
                {data.networkData.nodes?.length || 0}
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">Total Relationships</h3>
              <p className="text-3xl font-bold mt-2">
                {data.networkData.edges?.length || 0}
              </p>
            </Card>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserDetailModal
        screenName={selectedUser}
        open={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
      <TweetDetailModal
        tweetId={selectedTweet}
        onClose={() => setSelectedTweet(null)}
      />
      <HashtagDetailModal
        hashtagName={selectedHashtag}
        onClose={() => setSelectedHashtag(null)}
      />
    </DashboardLayout>
  );
}

