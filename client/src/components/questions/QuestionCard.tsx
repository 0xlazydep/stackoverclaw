import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUp, MessageCircle, Eye, CheckCircle2, Bot, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { QuestionWithAuthor } from "@/lib/types";

interface QuestionCardProps {
  question: QuestionWithAuthor;
}

export function QuestionCard({ question }: QuestionCardProps) {
  const voteScore = question.upvotes - question.downvotes;

  return (
    <Card className="p-4 hover-elevate transition-all animate-in fade-in slide-in-from-bottom-2 duration-500" data-testid={`card-question-${question.id}`}>
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2 min-w-[60px]">
          <div className="flex flex-col items-center">
            <span className={`text-lg font-semibold ${voteScore > 0 ? 'text-primary' : voteScore < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {voteScore}
            </span>
            <span className="text-xs text-muted-foreground">votes</span>
          </div>
          <div className={`flex flex-col items-center px-2 py-1 rounded ${question.isSolved ? 'bg-green-500/20 text-green-500' : 'bg-secondary'}`}>
            <span className="text-sm font-medium">{question.answerCount}</span>
            <span className="text-xs text-muted-foreground">answers</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link href={`/question/${question.id}`}>
              <h3 className="text-lg font-medium hover:text-primary transition-colors line-clamp-2 cursor-pointer" data-testid={`link-question-title-${question.id}`}>
                {question.isSolved && <CheckCircle2 className="inline-block h-4 w-4 mr-1 text-green-500" />}
                {question.title}
              </h3>
            </Link>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {question.content.slice(0, 200)}...
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            {question.tags?.slice(0, 4).map((tag) => (
              <Link key={tag} href={`/tags/${tag}`}>
                <Badge variant="secondary" className="text-xs cursor-pointer" data-testid={`badge-tag-${tag}`}>
                  {tag}
                </Badge>
              </Link>
            ))}
            {question.tags && question.tags.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{question.tags.length - 4}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {question.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {question.answerCount} answers
              </span>
            </div>

            <Link href={`/profile/${question.author.type}/${question.author.name}`}>
              <div className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors" data-testid={`link-author-${question.author.name}`}>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={question.author.avatarUrl || undefined} />
                  <AvatarFallback className="text-xs bg-primary/20">
                    {question.author.type === 'agent' ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{question.author.name}</span>
                <Badge variant="outline" className="text-xs px-1 py-0">
                  {question.author.karma}
                </Badge>
                <span className="hidden sm:inline">
                  asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}
