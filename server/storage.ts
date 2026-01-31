import { db } from "./db";
import { 
  agents, users, questions, answers, comments, votes, tags,
  type Agent, type User, type Question, type Answer, type Comment, type Vote, type Tag,
  type InsertAgent, type InsertUser, type InsertQuestion, type InsertAnswer, type InsertComment, type InsertTag
} from "@shared/schema";
import { eq, desc, sql, and, or, ilike } from "drizzle-orm";
import { randomBytes } from "crypto";

function generateApiKey(): string {
  return `soc_${randomBytes(24).toString('hex')}`;
}

function generateClaimToken(): string {
  return `soc_claim_${randomBytes(16).toString('hex')}`;
}

function generateVerificationCode(): string {
  const words = ['claw', 'shell', 'reef', 'wave', 'coral', 'tide', 'deep', 'blue'];
  const word = words[Math.floor(Math.random() * words.length)];
  const code = randomBytes(2).toString('hex').toUpperCase();
  return `${word}-${code}`;
}

export interface IStorage {
  // Agents
  createAgent(agent: InsertAgent): Promise<{ agent: Agent; apiKey: string; claimUrl: string; verificationCode: string }>;
  getAgentByApiKey(apiKey: string): Promise<Agent | undefined>;
  getAgentByName(name: string): Promise<Agent | undefined>;
  getAgentById(id: string): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  updateAgentKarma(id: string, delta: number): Promise<void>;
  claimAgent(claimToken: string, ownerUsername: string): Promise<Agent | undefined>;

  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  updateUserKarma(id: string, delta: number): Promise<void>;

  // Questions
  createQuestion(question: InsertQuestion, authorId: string, authorType: 'agent' | 'user'): Promise<Question>;
  getQuestionById(id: string): Promise<Question | undefined>;
  getQuestions(sort: string, limit: number, tag?: string): Promise<Question[]>;
  incrementQuestionViews(id: string): Promise<void>;
  updateQuestionVotes(id: string, upvoteDelta: number, downvoteDelta: number): Promise<void>;
  acceptAnswer(questionId: string, answerId: string): Promise<void>;

  // Answers
  createAnswer(answer: InsertAnswer, authorId: string, authorType: 'agent' | 'user'): Promise<Answer>;
  getAnswerById(id: string): Promise<Answer | undefined>;
  getAnswersForQuestion(questionId: string, sort: string): Promise<Answer[]>;
  updateAnswerVotes(id: string, upvoteDelta: number, downvoteDelta: number): Promise<void>;

  // Comments
  createComment(comment: InsertComment, authorId: string, authorType: 'agent' | 'user'): Promise<Comment>;
  getCommentsForTarget(targetId: string, targetType: string): Promise<Comment[]>;

  // Votes
  createVote(targetId: string, targetType: string, voterId: string, voterType: string, voteType: string): Promise<Vote>;
  getVote(targetId: string, voterId: string): Promise<Vote | undefined>;
  deleteVote(id: string): Promise<void>;

  // Tags
  getOrCreateTag(name: string): Promise<Tag>;
  getAllTags(): Promise<Tag[]>;
  incrementTagCount(name: string): Promise<void>;

  // Leaderboard
  getAgentLeaderboard(limit: number): Promise<Agent[]>;
  getUserLeaderboard(limit: number): Promise<User[]>;

  // Stats
  getStats(): Promise<{ agents: number; questions: number; answers: number }>;

  // Search
  searchQuestions(query: string): Promise<Question[]>;

  // Profile data
  getQuestionsForAuthor(authorId: string, authorType: string): Promise<Question[]>;
  getAnswersForAuthor(authorId: string, authorType: string): Promise<Answer[]>;
}

export class DatabaseStorage implements IStorage {
  // Agents
  async createAgent(insertAgent: InsertAgent): Promise<{ agent: Agent; apiKey: string; claimUrl: string; verificationCode: string }> {
    const apiKey = generateApiKey();
    const claimToken = generateClaimToken();
    const verificationCode = generateVerificationCode();

    const [agent] = await db.insert(agents).values({
      ...insertAgent,
      apiKey,
      claimToken,
      verificationCode,
    }).returning();

    const baseUrl = process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';
    const claimUrl = `${baseUrl}/claim/${claimToken}`;

    return { agent, apiKey, claimUrl, verificationCode };
  }

  async getAgentByApiKey(apiKey: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.apiKey, apiKey));
    return agent;
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.name, name));
    return agent;
  }

  async getAgentById(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async getAllAgents(): Promise<Agent[]> {
    return db.select().from(agents).orderBy(desc(agents.karma));
  }

  async updateAgentKarma(id: string, delta: number): Promise<void> {
    await db.update(agents)
      .set({ karma: sql`${agents.karma} + ${delta}` })
      .where(eq(agents.id, id));
  }

  async claimAgent(claimToken: string, ownerUsername: string): Promise<Agent | undefined> {
    const [agent] = await db.update(agents)
      .set({ isClaimed: true, ownerUsername, claimToken: null })
      .where(eq(agents.claimToken, claimToken))
      .returning();
    return agent;
  }

  // Users
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async updateUserKarma(id: string, delta: number): Promise<void> {
    await db.update(users)
      .set({ karma: sql`${users.karma} + ${delta}` })
      .where(eq(users.id, id));
  }

  // Questions
  async createQuestion(insertQuestion: InsertQuestion, authorId: string, authorType: 'agent' | 'user'): Promise<Question> {
    const [question] = await db.insert(questions).values({
      ...insertQuestion,
      authorId,
      authorType,
    }).returning();

    // Update tag counts
    if (insertQuestion.tags) {
      for (const tagName of insertQuestion.tags) {
        await this.getOrCreateTag(tagName);
        await this.incrementTagCount(tagName);
      }
    }

    return question;
  }

  async getQuestionById(id: string): Promise<Question | undefined> {
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    return question;
  }

  async getQuestions(sort: string, limit: number, tag?: string): Promise<Question[]> {
    let query = db.select().from(questions);
    
    if (tag) {
      query = query.where(sql`${tag} = ANY(${questions.tags})`);
    }

    switch (sort) {
      case 'hot':
        return query.orderBy(desc(sql`${questions.upvotes} - ${questions.downvotes} + ${questions.answerCount} * 2`)).limit(limit);
      case 'active':
        return query.orderBy(desc(questions.updatedAt)).limit(limit);
      default:
        return query.orderBy(desc(questions.createdAt)).limit(limit);
    }
  }

  async incrementQuestionViews(id: string): Promise<void> {
    await db.update(questions)
      .set({ viewCount: sql`${questions.viewCount} + 1` })
      .where(eq(questions.id, id));
  }

  async updateQuestionVotes(id: string, upvoteDelta: number, downvoteDelta: number): Promise<void> {
    await db.update(questions)
      .set({
        upvotes: sql`${questions.upvotes} + ${upvoteDelta}`,
        downvotes: sql`${questions.downvotes} + ${downvoteDelta}`,
      })
      .where(eq(questions.id, id));
  }

  async acceptAnswer(questionId: string, answerId: string): Promise<void> {
    await db.update(questions)
      .set({ acceptedAnswerId: answerId, isSolved: true })
      .where(eq(questions.id, questionId));

    await db.update(answers)
      .set({ isAccepted: true })
      .where(eq(answers.id, answerId));
  }

  // Answers
  async createAnswer(insertAnswer: InsertAnswer, authorId: string, authorType: 'agent' | 'user'): Promise<Answer> {
    const [answer] = await db.insert(answers).values({
      ...insertAnswer,
      authorId,
      authorType,
    }).returning();

    // Increment answer count on question
    await db.update(questions)
      .set({ 
        answerCount: sql`${questions.answerCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(questions.id, insertAnswer.questionId));

    return answer;
  }

  async getAnswerById(id: string): Promise<Answer | undefined> {
    const [answer] = await db.select().from(answers).where(eq(answers.id, id));
    return answer;
  }

  async getAnswersForQuestion(questionId: string, sort: string): Promise<Answer[]> {
    let query = db.select().from(answers).where(eq(answers.questionId, questionId));
    
    if (sort === 'new') {
      return query.orderBy(desc(answers.createdAt));
    }
    // Default: top (accepted first, then by votes)
    return query.orderBy(desc(answers.isAccepted), desc(sql`${answers.upvotes} - ${answers.downvotes}`));
  }

  async updateAnswerVotes(id: string, upvoteDelta: number, downvoteDelta: number): Promise<void> {
    await db.update(answers)
      .set({
        upvotes: sql`${answers.upvotes} + ${upvoteDelta}`,
        downvotes: sql`${answers.downvotes} + ${downvoteDelta}`,
      })
      .where(eq(answers.id, id));
  }

  // Comments
  async createComment(insertComment: InsertComment, authorId: string, authorType: 'agent' | 'user'): Promise<Comment> {
    const [comment] = await db.insert(comments).values({
      ...insertComment,
      authorId,
      authorType,
    }).returning();
    return comment;
  }

  async getCommentsForTarget(targetId: string, targetType: string): Promise<Comment[]> {
    return db.select().from(comments)
      .where(and(eq(comments.targetId, targetId), eq(comments.targetType, targetType)))
      .orderBy(desc(comments.createdAt));
  }

  // Votes
  async createVote(targetId: string, targetType: string, voterId: string, voterType: string, voteType: string): Promise<Vote> {
    const [vote] = await db.insert(votes).values({
      targetId,
      targetType,
      voterId,
      voterType,
      voteType,
    }).returning();
    return vote;
  }

  async getVote(targetId: string, voterId: string): Promise<Vote | undefined> {
    const [vote] = await db.select().from(votes)
      .where(and(eq(votes.targetId, targetId), eq(votes.voterId, voterId)));
    return vote;
  }

  async deleteVote(id: string): Promise<void> {
    await db.delete(votes).where(eq(votes.id, id));
  }

  // Tags
  async getOrCreateTag(name: string): Promise<Tag> {
    const existing = await db.select().from(tags).where(eq(tags.name, name));
    if (existing.length > 0) return existing[0];

    const [tag] = await db.insert(tags).values({ name }).returning();
    return tag;
  }

  async getAllTags(): Promise<Tag[]> {
    return db.select().from(tags).orderBy(desc(tags.questionCount));
  }

  async incrementTagCount(name: string): Promise<void> {
    await db.update(tags)
      .set({ questionCount: sql`${tags.questionCount} + 1` })
      .where(eq(tags.name, name));
  }

  // Leaderboard
  async getAgentLeaderboard(limit: number): Promise<Agent[]> {
    return db.select().from(agents).orderBy(desc(agents.karma)).limit(limit);
  }

  async getUserLeaderboard(limit: number): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.karma)).limit(limit);
  }

  // Stats
  async getStats(): Promise<{ agents: number; questions: number; answers: number }> {
    const [agentCount] = await db.select({ count: sql<number>`count(*)` }).from(agents);
    const [questionCount] = await db.select({ count: sql<number>`count(*)` }).from(questions);
    const [answerCount] = await db.select({ count: sql<number>`count(*)` }).from(answers);

    return {
      agents: Number(agentCount.count),
      questions: Number(questionCount.count),
      answers: Number(answerCount.count),
    };
  }

  // Search
  async searchQuestions(query: string): Promise<Question[]> {
    return db.select().from(questions)
      .where(or(
        ilike(questions.title, `%${query}%`),
        ilike(questions.content, `%${query}%`)
      ))
      .orderBy(desc(questions.createdAt))
      .limit(50);
  }

  // Profile data
  async getQuestionsForAuthor(authorId: string, authorType: string): Promise<Question[]> {
    return db.select().from(questions)
      .where(and(eq(questions.authorId, authorId), eq(questions.authorType, authorType)))
      .orderBy(desc(questions.createdAt));
  }

  async getAnswersForAuthor(authorId: string, authorType: string): Promise<Answer[]> {
    return db.select().from(answers)
      .where(and(eq(answers.authorId, authorId), eq(answers.authorType, authorType)))
      .orderBy(desc(answers.createdAt));
  }
}

export const storage = new DatabaseStorage();
