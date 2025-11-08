"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  User as UserIcon,
  Calendar,
  MapPin,
  Link as LinkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TweetDetailModal } from "./tweet-detail-modal";
import {
  GET_USER_BY_SCREEN_NAME,
  GET_USER_TWEETS,
  GET_USER_STATS,
} from "@/lib/graphql/queries";
import type {
  UserResponse,
  TweetsByUserResponse,
  UserStatsResponse,
} from "@/lib/types";

/**
 * User Detail Modal Component
 *
 * Shows comprehensive user information when a node is clicked:
 * - Profile details (username, followers, location, etc.)
 * - User's tweets
 * - User's hashtags
 * - User statistics
 */

interface UserDetailModalProps {
  screenName: string | null;
  open: boolean;
  onClose: () => void;
}

export function UserDetailModal({
  screenName,
  open,
  onClose,
}: UserDetailModalProps) {
  const [selectedTweet, setSelectedTweet] = useState<string | null>(null);

  const { data: userData, loading: userLoading } = useQuery<UserResponse>(
    GET_USER_BY_SCREEN_NAME,
    {
      variables: { screenName },
      skip: !screenName,
    },
  );

  const {
    data: tweetsData,
    loading: tweetsLoading,
    error: tweetsError,
  } = useQuery<TweetsByUserResponse>(GET_USER_TWEETS, {
    variables: { screenName, limit: 10 },
    skip: !screenName,
  });

  const {
    data: statsData,
    loading: statsLoading,
    error: statsError,
  } = useQuery<UserStatsResponse>(GET_USER_STATS, {
    variables: { screenName },
    skip: !screenName,
  });

  const user = userData?.user;
  const tweets = tweetsData?.tweetsByUser || [];
  const userStats = statsData?.userStats;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            User Profile
          </DialogTitle>
          <DialogDescription>
            View detailed information about this user
          </DialogDescription>
        </DialogHeader>

        {userLoading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading user data...</p>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">User not found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-muted-foreground">@{user.screen_name}</p>

                {/* Stats */}
                <div className="flex gap-6 mt-3">
                  <div>
                    <span className="font-bold text-lg">
                      {user.followers?.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      Followers
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-lg">
                      {user.following?.toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground ml-1">
                      Following
                    </span>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                  {user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.url && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="h-4 w-4" />
                      <a
                        href={user.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-primary underline"
                      >
                        {user.url.replace(/^https?:\/\//, "")}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs for Tweets and Stats */}
            <Tabs defaultValue="tweets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="tweets">
                  Tweets ({userStats?.tweetCount || tweets.length})
                </TabsTrigger>
                <TabsTrigger value="stats">Stats</TabsTrigger>
              </TabsList>

              <TabsContent value="tweets" className="space-y-3 mt-4">
                {tweetsLoading ? (
                  <p className="text-center text-muted-foreground py-8">
                    Loading tweets...
                  </p>
                ) : tweetsError ? (
                  <div className="text-center text-destructive py-8">
                    <p>Error loading tweets</p>
                    <p className="text-sm mt-2">{tweetsError.message}</p>
                  </div>
                ) : tweets.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No tweets found for @{screenName}</p>
                    <p className="text-xs mt-2">
                      This user may have no tweets in the dataset
                    </p>
                  </div>
                ) : (
                  tweets.map(
                    (tweet: {
                      id: string;
                      text: string;
                      created_at?: string;
                      favorites?: number;
                    }) => (
                      <Card
                        key={tweet.id}
                        className="p-4 cursor-pointer hover:bg-accent transition-colors"
                        onClick={() => setSelectedTweet(tweet.id)}
                      >
                        <p className="text-sm line-clamp-3">{tweet.text}</p>
                        {tweet.created_at && (
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {new Date(tweet.created_at).toLocaleDateString()}
                            </span>
                            {tweet.favorites !== undefined &&
                              tweet.favorites > 0 && (
                                <span className="ml-auto">
                                  ❤️ {tweet.favorites}
                                </span>
                              )}
                          </div>
                        )}
                      </Card>
                    ),
                  )
                )}
              </TabsContent>

              <TabsContent value="stats" className="mt-4">
                {statsLoading ? (
                  <p className="text-center text-muted-foreground py-8">
                    Loading stats...
                  </p>
                ) : statsError ? (
                  <div className="text-center text-destructive py-8">
                    <p>Error loading stats</p>
                    <p className="text-sm mt-2">{statsError.message}</p>
                  </div>
                ) : !userStats ? (
                  <div className="text-center text-muted-foreground py-8">
                    <p>No stats available for @{screenName}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">
                        Total Tweets
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {userStats.tweetCount?.toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">
                        Followers
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {userStats.followerCount?.toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">
                        Following
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {userStats.followingCount?.toLocaleString()}
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground">
                        Unique Hashtags
                      </div>
                      <div className="text-2xl font-bold mt-1">
                        {userStats.uniqueHashtagsUsed?.toLocaleString()}
                      </div>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>

      {/* Tweet Detail Modal */}
      <TweetDetailModal
        tweetId={selectedTweet}
        onClose={() => setSelectedTweet(null)}
      />
    </Dialog>
  );
}
