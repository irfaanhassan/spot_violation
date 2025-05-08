
import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface VoteButtonsProps {
  reportId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote: 'upvote' | 'downvote' | null;
  onVoteChange?: () => void;
}

export function VoteButtons({ 
  reportId, 
  initialUpvotes = 0,
  initialDownvotes = 0,
  userVote = null,
  onVoteChange
}: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentUserVote, setCurrentUserVote] = useState<'upvote' | 'downvote' | null>(userVote);
  const [isVoting, setIsVoting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to vote on reports",
        variant: "destructive"
      });
      return;
    }

    setIsVoting(true);
    
    try {
      // If user already voted the same way, remove the vote
      if (currentUserVote === voteType) {
        // Delete existing vote
        const { error } = await supabase
          .from('report_votes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        if (voteType === 'upvote') {
          setUpvotes(prev => prev - 1);
        } else {
          setDownvotes(prev => prev - 1);
        }
        
        setCurrentUserVote(null);
        toast({ title: "Vote removed" });
      }
      // If user voted differently before, change their vote
      else if (currentUserVote !== null) {
        // Update existing vote
        const { error } = await supabase
          .from('report_votes')
          .update({ vote_type: voteType })
          .eq('report_id', reportId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
          setDownvotes(prev => prev - 1);
        } else {
          setUpvotes(prev => prev - 1);
          setDownvotes(prev => prev + 1);
        }
        
        setCurrentUserVote(voteType);
        toast({ title: `Vote changed to ${voteType}` });
      }
      // If user hasn't voted yet, add a new vote
      else {
        // Insert new vote
        const { error } = await supabase
          .from('report_votes')
          .insert({
            report_id: reportId,
            user_id: user.id,
            vote_type: voteType
          });

        if (error) throw error;

        // Update local state
        if (voteType === 'upvote') {
          setUpvotes(prev => prev + 1);
        } else {
          setDownvotes(prev => prev + 1);
        }
        
        setCurrentUserVote(voteType);
        toast({ title: `Vote recorded` });
      }
      
      // Notify parent component that vote has changed
      if (onVoteChange) {
        onVoteChange();
      }
      
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "Failed to record your vote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 items-center">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={isVoting}
          onClick={() => handleVote('upvote')}
          className={`relative ${currentUserVote === 'upvote' ? 'bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800' : ''}`}
        >
          <ThumbsUp className={`h-5 w-5 ${currentUserVote === 'upvote' ? 'fill-green-500' : ''}`} />
          <span className="ml-1">{upvotes}</span>
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          disabled={isVoting}
          onClick={() => handleVote('downvote')}
          className={`relative ${currentUserVote === 'downvote' ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:text-red-800' : ''}`}
        >
          <ThumbsDown className={`h-5 w-5 ${currentUserVote === 'downvote' ? 'fill-red-500' : ''}`} />
          <span className="ml-1">{downvotes}</span>
        </Button>
      </div>
      
      {upvotes >= 5 && downvotes === 0 && (
        <div className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
          Community verified
        </div>
      )}
    </div>
  );
}
