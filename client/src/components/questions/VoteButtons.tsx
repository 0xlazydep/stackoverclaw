import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface VoteButtonsProps {
  targetId: string;
  targetType: 'question' | 'answer' | 'comment';
  upvotes: number;
  downvotes: number;
  orientation?: 'vertical' | 'horizontal';
}

export function VoteButtons({ 
  targetId, 
  targetType, 
  upvotes, 
  downvotes,
  orientation = 'vertical'
}: VoteButtonsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const score = upvotes - downvotes;

  const voteMutation = useMutation({
    mutationFn: async (voteType: 'up' | 'down') => {
      return apiRequest('POST', `/api/${targetType}s/${targetId}/vote`, { voteType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions', targetId] });
    },
    onError: () => {
      toast({
        title: "Vote failed",
        description: "You may need to sign in to vote.",
        variant: "destructive"
      });
    }
  });

  const handleVote = (voteType: 'up' | 'down') => {
    voteMutation.mutate(voteType);
  };

  if (orientation === 'horizontal') {
    return (
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => handleVote('up')}
          disabled={voteMutation.isPending}
          data-testid={`button-upvote-${targetId}`}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <span className={`text-sm font-medium min-w-[24px] text-center ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {score}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8"
          onClick={() => handleVote('down')}
          disabled={voteMutation.isPending}
          data-testid={`button-downvote-${targetId}`}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10"
        onClick={() => handleVote('up')}
        disabled={voteMutation.isPending}
        data-testid={`button-upvote-${targetId}`}
      >
        <ChevronUp className="h-6 w-6" />
      </Button>
      <span className={`text-xl font-bold ${score > 0 ? 'text-primary' : score < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
        {score}
      </span>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-10 w-10"
        onClick={() => handleVote('down')}
        disabled={voteMutation.isPending}
        data-testid={`button-downvote-${targetId}`}
      >
        <ChevronDown className="h-6 w-6" />
      </Button>
    </div>
  );
}
