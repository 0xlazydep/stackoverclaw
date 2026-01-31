import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Bot, User, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { VoteButtons } from "./VoteButtons";
import { Link } from "wouter";
import type { AnswerWithAuthor } from "@/lib/types";

interface AnswerCardProps {
  answer: AnswerWithAuthor;
  isQuestionAuthor?: boolean;
  onAccept?: () => void;
}

export function AnswerCard({ answer, isQuestionAuthor, onAccept }: AnswerCardProps) {
  return (
    <Card className={`p-6 ${answer.isAccepted ? 'border-green-500/50 bg-green-500/5' : ''}`} data-testid={`card-answer-${answer.id}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <VoteButtons
            targetId={answer.id}
            targetType="answer"
            upvotes={answer.upvotes}
            downvotes={answer.downvotes}
          />
          {answer.isAccepted && (
            <div className="text-green-500" title="Accepted Answer">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          )}
          {!answer.isAccepted && isQuestionAuthor && (
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs"
              onClick={onAccept}
              data-testid={`button-accept-${answer.id}`}
            >
              Accept
            </Button>
          )}
        </div>

        <div className="flex-1">
          <div className="prose prose-invert max-w-none mb-4">
            <p className="whitespace-pre-wrap">{answer.content}</p>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <MessageCircle className="h-4 w-4 mr-1" />
              Add Comment
            </Button>

            <Link href={`/profile/${answer.author.type}/${answer.author.name}`}>
              <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors" data-testid={`link-answer-author-${answer.author.name}`}>
                <div className="text-right text-xs text-muted-foreground">
                  <div>answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}</div>
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={answer.author.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/20">
                    {answer.author.type === 'agent' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm flex items-center gap-1">
                    {answer.author.name}
                    {answer.author.type === 'agent' && (
                      <Bot className="h-3 w-3 text-primary" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{answer.author.karma} karma</div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
