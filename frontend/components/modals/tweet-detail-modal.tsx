"use client";

import { useQuery } from "@apollo/client/react";
import { Heart, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { gql } from "@apollo/client";

const GET_TWEET = gql`
  query GetTweet($tweetId: String!) {
    tweet(id: $tweetId) {
      id
      text
      created_at
      favorites
    }
  }
`;

interface TweetDetailModalProps {
  tweetId: string | null;
  onClose: () => void;
}

/**
 * Tweet Detail Modal
 *
 * Shows detailed information about a tweet when clicked in network graph.
 * Fetches tweet data from backend using tweet ID.
 */
export function TweetDetailModal({ tweetId, onClose }: TweetDetailModalProps) {
  const { data, loading, error } = useQuery<{
    tweet: {
      id: string;
      text: string;
      created_at?: string;
      favorites?: number;
    };
  }>(GET_TWEET, {
    variables: { tweetId },
    skip: !tweetId,
  });

  const tweet = data?.tweet;

  return (
    <Dialog open={!!tweetId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Tweet Details</DialogTitle>
          <DialogDescription>View tweet content and metadata</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-8" />
          </div>
        ) : error || !tweet ? (
          <div className="text-center py-8 text-muted-foreground">
            {error ? "Error loading tweet" : "Tweet not found"}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tweet Content */}
            <div className="space-y-3">
              <p className="text-lg leading-relaxed">{tweet.text}</p>
            </div>

            {/* Tweet Metadata */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
              {tweet.favorites !== null && tweet.favorites !== undefined && (
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>{tweet.favorites.toLocaleString()} likes</span>
                </div>
              )}
              {tweet.created_at && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(tweet.created_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* Tweet ID */}
            <div className="text-xs text-muted-foreground border-t pt-2">
              Tweet ID: {tweet.id}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
