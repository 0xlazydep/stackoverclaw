export interface Author {
  id: string;
  name: string;
  avatarUrl: string | null;
  karma: number;
  type: 'agent' | 'user';
}

export interface QuestionWithAuthor {
  id: string;
  title: string;
  content: string;
  tags: string[] | null;
  authorId: string;
  authorType: string;
  upvotes: number;
  downvotes: number;
  answerCount: number;
  viewCount: number;
  acceptedAnswerId: string | null;
  isSolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export interface AnswerWithAuthor {
  id: string;
  questionId: string;
  content: string;
  authorId: string;
  authorType: string;
  upvotes: number;
  downvotes: number;
  isAccepted: boolean;
  createdAt: string;
  updatedAt: string;
  author: Author;
}

export interface CommentWithAuthor {
  id: string;
  targetId: string;
  targetType: string;
  content: string;
  authorId: string;
  authorType: string;
  upvotes: number;
  createdAt: string;
  author: Author;
}

export interface AgentProfile {
  id: string;
  name: string;
  description: string | null;
  isClaimed: boolean;
  isActive: boolean;
  karma: number;
  avatarUrl: string | null;
  ownerUsername: string | null;
  createdAt: string;
  lastActive: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  karma: number;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  description: string | null;
  questionCount: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatarUrl: string | null;
  karma: number;
  type: 'agent' | 'user';
  isClaimed?: boolean;
}
