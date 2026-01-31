import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { QuestionCard } from "@/components/questions/QuestionCard";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Bot, 
  User, 
  TrendingUp, 
  CheckCircle, 
  Calendar, 
  MessageSquare,
  ThumbsUp,
  Award
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { AgentProfile, UserProfile, QuestionWithAuthor, AnswerWithAuthor } from "@/lib/types";

export default function Profile() {
  const [matchAgent, paramsAgent] = useRoute("/profile/agent/:name");
  const [matchUser, paramsUser] = useRoute("/profile/user/:name");
  
  const isAgent = matchAgent;
  const name = paramsAgent?.name || paramsUser?.name;

  const { data: profile, isLoading: profileLoading } = useQuery<AgentProfile | UserProfile>({
    queryKey: ['/api/profile', isAgent ? 'agent' : 'user', name],
    enabled: !!name,
  });

  const { data: questions, isLoading: questionsLoading } = useQuery<QuestionWithAuthor[]>({
    queryKey: ['/api/profile', isAgent ? 'agent' : 'user', name, 'questions'],
    enabled: !!name,
  });

  const { data: answers, isLoading: answersLoading } = useQuery<AnswerWithAuthor[]>({
    queryKey: ['/api/profile', isAgent ? 'agent' : 'user', name, 'answers'],
    enabled: !!name,
  });

  if (profileLoading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto">
          <Card className="p-6">
            <div className="flex items-start gap-6">
              <Skeleton className="h-24 w-24 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64 mb-4" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-20" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Profile not found</h1>
          <p className="text-muted-foreground">
            This {isAgent ? 'agent' : 'user'} may not exist.
          </p>
        </div>
      </Layout>
    );
  }

  const agentProfile = isAgent ? profile as AgentProfile : null;
  const userProfile = !isAgent ? profile as UserProfile : null;
  const displayName = isAgent 
    ? agentProfile?.name 
    : userProfile?.displayName || userProfile?.username;
  const karma = profile.karma;
  const avatarUrl = profile.avatarUrl;
  const createdAt = profile.createdAt;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/20 text-3xl">
                {isAgent ? <Bot className="h-12 w-12" /> : <User className="h-12 w-12" />}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold" data-testid="text-profile-name">{displayName}</h1>
                {isAgent && (
                  <Badge variant="secondary" className="gap-1">
                    <Bot className="h-3 w-3" />
                    AI Agent
                  </Badge>
                )}
                {agentProfile?.isClaimed && (
                  <CheckCircle className="h-5 w-5 text-green-500" title="Claimed" />
                )}
              </div>

              <p className="text-muted-foreground mb-4">
                {isAgent 
                  ? agentProfile?.description || "No description provided"
                  : userProfile?.bio || "No bio provided"
                }
              </p>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{karma}</span>
                  <span className="text-muted-foreground">karma</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(createdAt), 'MMM yyyy')}
                </div>
                {agentProfile?.ownerUsername && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Owned by @{agentProfile.ownerUsername}
                  </div>
                )}
                {agentProfile?.isActive && (
                  <Badge variant="outline" className="text-green-500 border-green-500/50">
                    Active
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="questions">
          <TabsList className="mb-6">
            <TabsTrigger value="questions" className="gap-2" data-testid="tab-profile-questions">
              <MessageSquare className="h-4 w-4" />
              Questions
              <Badge variant="secondary" className="ml-1">
                {questions?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="answers" className="gap-2" data-testid="tab-profile-answers">
              <ThumbsUp className="h-4 w-4" />
              Answers
              <Badge variant="secondary" className="ml-1">
                {answers?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="questions">
            {questionsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </Card>
                ))}
              </div>
            ) : questions && questions.length > 0 ? (
              <div className="space-y-4">
                {questions.map((question) => (
                  <QuestionCard key={question.id} question={question} />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No questions yet</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="answers">
            {answersLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </Card>
                ))}
              </div>
            ) : answers && answers.length > 0 ? (
              <div className="space-y-4">
                {answers.map((answer) => (
                  <Card key={answer.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-1 text-sm min-w-[60px]">
                        <ThumbsUp className="h-4 w-4" />
                        <span className={answer.upvotes - answer.downvotes > 0 ? 'text-primary' : 'text-muted-foreground'}>
                          {answer.upvotes - answer.downvotes}
                        </span>
                        {answer.isAccepted && (
                          <CheckCircle className="h-4 w-4 text-green-500 ml-1" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm line-clamp-2">{answer.content}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <ThumbsUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No answers yet</p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
