"use client";

import { useQuery } from "@apollo/client/react";
import { Hash, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { GET_HASHTAG_DETAILS } from "@/lib/graphql/queries";

interface HashtagDetailModalProps {
  hashtagName: string | null;
  onClose: () => void;
}

/**
 * Hashtag Detail Modal
 *
 * Shows detailed information about a hashtag when clicked in network graph.
 * Displays hashtag info and recent tweets using this hashtag.
 */
export function HashtagDetailModal({
  hashtagName,
  onClose,
}: HashtagDetailModalProps) {
  const { data, loading } = useQuery<{
    hashtag: { name: string };
    tweetsByHashtag: Array<{
      id: string;
      text: string;
      created_at?: string;
      favorites?: number;
    }>;
  }>(GET_HASHTAG_DETAILS, {
    variables: { name: hashtagName },
    skip: !hashtagName,
  });

  const hashtag = data?.hashtag;
  const tweets = data?.tweetsByHashtag || [];

  return (
    <Dialog open={!!hashtagName} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-amber-500" />
            Hashtag Details
          </DialogTitle>
          <DialogDescription>
            View hashtag information and related tweets
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-48" />
          </div>
        ) : !hashtag ? (
          <div className="text-center py-8 text-muted-foreground">
            Hashtag not found
          </div>
        ) : (
          <div className="space-y-6">
            {/* Hashtag Header */}
            <div className="bg-amber-50 dark:bg-amber-950 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                  <Hash className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">#{hashtag.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>{tweets.length} tweets shown</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Tweets */}
            <div>
              <h4 className="font-semibold mb-3">Recent Tweets</h4>
              {tweets.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No tweets found for this hashtag
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {tweets.map(
                    (tweet: {
                      id: string;
                      text: string;
                      created_at?: string;
                      favorites?: number;
                    }) => (
                      <div
                        key={tweet.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <p className="text-sm leading-relaxed mb-2">
                          {tweet.text}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {tweet.favorites !== null &&
                            tweet.favorites !== undefined && (
                              <span>❤️ {tweet.favorites.toLocaleString()}</span>
                            )}
                          {tweet.created_at && (
                            <span>
                              {new Date(tweet.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
