'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { Hash, TrendingUp, Search } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { GET_TRENDING_HASHTAGS, GET_TWEETS_BY_HASHTAG } from '@/lib/graphql/queries';

/**
 * Hashtags Page
 * 
 * View trending hashtags and explore related tweets.
 * Shows hashtag usage statistics and recent tweets.
 */

export default function HashtagsPage() {
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: hashtagsData, loading: hashtagsLoading } = useQuery(GET_TRENDING_HASHTAGS, {
    variables: { limit: 50 },
  });

  // Filter hashtags based on search query
  const filteredHashtags = useMemo(() => {
    if (!hashtagsData?.trendingHashtags) return [];
    if (!searchQuery.trim()) return hashtagsData.trendingHashtags;
    
    const query = searchQuery.toLowerCase().replace(/^#/, ''); // Remove # if user typed it
    return hashtagsData.trendingHashtags.filter((hashtag: any) =>
      hashtag.name.toLowerCase().includes(query)
    );
  }, [hashtagsData, searchQuery]);

  const { data: tweetsData, loading: tweetsLoading } = useQuery(GET_TWEETS_BY_HASHTAG, {
    variables: { hashtagName: selectedHashtag || '', limit: 10 },
    skip: !selectedHashtag,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Hash className="h-8 w-8" />
            Trending Hashtags
          </h1>
          <p className="text-muted-foreground mt-2">
            Explore popular topics and conversations
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Hashtags List */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold">Top Hashtags</h2>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search hashtags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {hashtagsLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : filteredHashtags.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No hashtags found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredHashtags.map((hashtag: any, index: number) => (
                  <button
                    key={hashtag.name}
                    onClick={() => setSelectedHashtag(hashtag.name)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      selectedHashtag === hashtag.name
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'hover:bg-accent border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">
                          #{index + 1}
                        </span>
                        <div>
                          <p className="font-semibold">#{hashtag.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {hashtag.usageCount.toLocaleString()} tweets
                          </p>
                        </div>
                      </div>
                      {selectedHashtag === hashtag.name && (
                        <TrendingUp className="h-4 w-4" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Related Tweets */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedHashtag ? `Tweets with #${selectedHashtag}` : 'Select a hashtag'}
            </h2>

            {!selectedHashtag ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Click on a hashtag to see related tweets</p>
              </div>
            ) : tweetsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            ) : tweetsData?.tweetsByHashtag?.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>No tweets found for this hashtag</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {tweetsData?.tweetsByHashtag?.map((tweet: any) => (
                  <div key={tweet.id} className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <p className="text-sm">{tweet.text}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span>❤️ {tweet.favorites}</span>
                      {tweet.created_at && (
                        <span>
                          {new Date(tweet.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
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

