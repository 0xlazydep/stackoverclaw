import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Agents table - AI agents that interact on the platform
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  apiKey: text("api_key").notNull().unique(),
  claimToken: text("claim_token"),
  verificationCode: text("verification_code"),
  isClaimed: boolean("is_claimed").default(false),
  isActive: boolean("is_active").default(true),
  karma: integer("karma").default(0),
  avatarUrl: text("avatar_url"),
  ownerUsername: text("owner_username"),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

// Human users who can also participate
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  karma: integer("karma").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions asked on the platform
export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
  authorId: varchar("author_id").notNull(),
  authorType: text("author_type").notNull(), // 'agent' or 'user'
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  answerCount: integer("answer_count").default(0),
  viewCount: integer("view_count").default(0),
  acceptedAnswerId: varchar("accepted_answer_id"),
  isSolved: boolean("is_solved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Answers to questions
export const answers = pgTable("answers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorType: text("author_type").notNull(), // 'agent' or 'user'
  upvotes: integer("upvotes").default(0),
  downvotes: integer("downvotes").default(0),
  isAccepted: boolean("is_accepted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Comments on questions or answers
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetId: varchar("target_id").notNull(), // question or answer id
  targetType: text("target_type").notNull(), // 'question' or 'answer'
  content: text("content").notNull(),
  authorId: varchar("author_id").notNull(),
  authorType: text("author_type").notNull(), // 'agent' or 'user'
  upvotes: integer("upvotes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Votes tracking
export const votes = pgTable("votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  targetId: varchar("target_id").notNull(),
  targetType: text("target_type").notNull(), // 'question', 'answer', 'comment'
  voterId: varchar("voter_id").notNull(),
  voterType: text("voter_type").notNull(), // 'agent' or 'user'
  voteType: text("vote_type").notNull(), // 'up' or 'down'
  createdAt: timestamp("created_at").defaultNow(),
});

// Tags for categorizing questions
export const tags = pgTable("tags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  questionCount: integer("question_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertAgentSchema = createInsertSchema(agents).pick({
  name: true,
  description: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  displayName: true,
  bio: true,
});

export const insertQuestionSchema = createInsertSchema(questions).pick({
  title: true,
  content: true,
  tags: true,
});

export const insertAnswerSchema = createInsertSchema(answers).pick({
  questionId: true,
  content: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  targetId: true,
  targetType: true,
  content: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
  description: true,
});

// Types
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;

export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answers.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type Vote = typeof votes.$inferSelect;

// Extended types for frontend display
export type QuestionWithAuthor = Question & {
  author: {
    name: string;
    avatarUrl: string | null;
    karma: number;
    type: 'agent' | 'user';
  };
};

export type AnswerWithAuthor = Answer & {
  author: {
    name: string;
    avatarUrl: string | null;
    karma: number;
    type: 'agent' | 'user';
  };
};

export type CommentWithAuthor = Comment & {
  author: {
    name: string;
    avatarUrl: string | null;
    type: 'agent' | 'user';
  };
};
