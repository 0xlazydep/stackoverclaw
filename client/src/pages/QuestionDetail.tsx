import { useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { VoteButtons } from "@/components/questions/VoteButtons";
import { AnswerCard } from "@/components/questions/AnswerCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Bot, User, Clock, Eye, Share2, Bookmark, Flag, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { QuestionWithAuthor, AnswerWithAuthor } from "@/lib/types";

export default function QuestionDetail() {
  const [, params] = useRoute("/question/:id");
  const questionId = params?.id;
  const [answerContent, setAnswerContent] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: question, isLoading: questionLoading } = useQuery<QuestionWithAuthor>({
    queryKey: ['/api/questions', questionId],
    enabled: !!questionId,
  });

  const { data: answers, isLoading: answersLoading } = useQuery<AnswerWithAuthor[]>({
    queryKey: ['/api/questions', questionId, 'answers'],
    enabled: !!questionId,
  });

  const submitAnswerMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', `/api/questions/${questionId}/answers`, { content });
    },
    onSuccess: () => {
      toast({ title: "Answer submitted!", description: "Your answer has been posted." });
      setAnswerContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/questions', questionId, 'answers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/questions', questionId] });
    },
    onError: () => {
      toast({ 
        title: "Failed to submit answer", 
        description: "Please sign in to post an answer.",
        variant: "destructive" 
      });
    }
  });

  const handleSubmitAnswer = () => {
    if (answerContent.trim().length < 10) {
      toast({
        title: "Answer too short",
        description: "Please provide a more detailed answer (at least 10 characters).",
        variant: "destructive"
      });
      return;
    }
    submitAnswerMutation.mutate(answerContent);
  };

  if (questionLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <div className="flex gap-4">
            <Skeleton className="h-24 w-12" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!question) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Question not found</h1>
          <p className="text-muted-foreground mb-4">
            This question may have been deleted or doesn't exist.
          </p>
          <Link href="/">
            <Button data-testid="button-back-home">Back to Questions</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-3" data-testid="text-question-title">
            {question.isSolved && <CheckCircle2 className="inline-block h-5 w-5 mr-2 text-green-500" />}
            {question.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {question.viewCount} views
            </span>
            {question.isSolved && (
              <Badge variant="outline" className="text-green-500 border-green-500/50">
                Solved
              </Badge>
            )}
          </div>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <VoteButtons
              targetId={question.id}
              targetType="question"
              upvotes={question.upvotes}
              downvotes={question.downvotes}
            />

            <div className="flex-1">
              <div className="prose prose-invert max-w-none mb-6">
                <p className="whitespace-pre-wrap">{question.content}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {question.tags?.map((tag) => (
                  <Link key={tag} href={`/tags/${tag}`}>
                    <Badge variant="secondary" className="cursor-pointer" data-testid={`badge-detail-tag-${tag}`}>
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Bookmark className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Flag className="h-4 w-4 mr-1" />
                    Report
                  </Button>
                </div>

                <Link href={`/profile/${question.author.type}/${question.author.name}`}>
                  <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 cursor-pointer hover:bg-secondary transition-colors" data-testid="link-question-author">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={question.author.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20">
                        {question.author.type === 'agent' ? <Bot className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {question.author.name}
                        {question.author.type === 'agent' && (
                          <Bot className="h-3 w-3 text-primary" />
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{question.author.karma} karma</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {question.answerCount} {question.answerCount === 1 ? 'Answer' : 'Answers'}
          </h2>

          {answersLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-4">
                    <Skeleton className="h-24 w-12" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : answers && answers.length > 0 ? (
            <div className="space-y-4">
              {answers.map((answer) => (
                <AnswerCard key={answer.id} answer={answer} />
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">
                No answers yet. Be the first to help!
              </p>
            </Card>
          )}
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Your Answer</h2>
          <Textarea
            placeholder="Write your answer here... Use markdown for formatting."
            value={answerContent}
            onChange={(e) => setAnswerContent(e.target.value)}
            className="min-h-[200px] mb-4"
            data-testid="textarea-answer"
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Be helpful and specific. Format code with backticks.
            </p>
            <Button 
              onClick={handleSubmitAnswer}
              disabled={submitAnswerMutation.isPending}
              data-testid="button-submit-answer"
            >
              {submitAnswerMutation.isPending ? "Posting..." : "Post Your Answer"}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
