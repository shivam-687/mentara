import { pgTable, text, integer, timestamp, jsonb, uuid, varchar, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    clerkId: varchar('clerk_id', { length: 255 }).unique().notNull(),
    email: varchar('email', { length: 255 }),
    name: varchar('name', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const classes = pgTable('classes', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 50 }).default('clarifying').notNull(),
    roadmap: jsonb('roadmap'),
    currentModuleId: varchar('current_module_id', { length: 255 }),
    currentSubtopicIndex: integer('current_subtopic_index').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
    role: varchar('role', { length: 50 }).notNull(),
    content: text('content').notNull(),
    toolCalls: jsonb('tool_calls'),
    toolCallId: varchar('tool_call_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const progress = pgTable('progress', {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).unique().notNull(),
    overallMastery: integer('overall_mastery').default(0).notNull(),
    modulesCompleted: integer('modules_completed').default(0).notNull(),
    modulesTotal: integer('modules_total').default(0).notNull(),
    totalQuestions: integer('total_questions').default(0).notNull(),
    totalCorrect: integer('total_correct').default(0).notNull(),
    weakConcepts: jsonb('weak_concepts').default([]).notNull(),
    learningTimeMinutes: integer('learning_time_minutes').default(0).notNull(),
    lastActivity: timestamp('last_activity').defaultNow().notNull(),
});

export const questionAnswers = pgTable('question_answers', {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
    moduleId: varchar('module_id', { length: 255 }),
    subtopic: varchar('subtopic', { length: 500 }),
    questionText: text('question_text').notNull(),
    questionType: varchar('question_type', { length: 50 }).notNull(),
    options: jsonb('options'),
    userAnswer: text('user_answer').notNull(),
    correctAnswer: text('correct_answer').notNull(),
    isCorrect: boolean('is_correct').notNull(),
    difficulty: varchar('difficulty', { length: 20 }).default('medium').notNull(),
    topic: varchar('topic', { length: 255 }),
    explanation: text('explanation'),
    nextReviewAt: timestamp('next_review_at'),
    reviewCount: integer('review_count').default(0).notNull(),
    easeFactor: integer('ease_factor').default(250).notNull(),
    intervalDays: integer('interval_days').default(1).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const testResults = pgTable('test_results', {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
    moduleId: varchar('module_id', { length: 255 }),
    title: varchar('title', { length: 500 }).notNull(),
    totalQuestions: integer('total_questions').notNull(),
    correctAnswers: integer('correct_answers').notNull(),
    score: integer('score').notNull(),
    timeTakenSeconds: integer('time_taken_seconds'),
    questionIds: jsonb('question_ids').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const flashcardDecks = pgTable('flashcard_decks', {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    cards: jsonb('cards').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const classNotes = pgTable('class_notes', {
    id: uuid('id').defaultRandom().primaryKey(),
    classId: uuid('class_id').references(() => classes.id, { onDelete: 'cascade' }).unique().notNull(),
    mode: varchar('mode', { length: 20 }).default('auto').notNull(),
    autoGenerate: boolean('auto_generate').default(true).notNull(),
    status: varchar('status', { length: 20 }).default('idle').notNull(),
    title: varchar('title', { length: 500 }),
    summary: text('summary'),
    markdown: text('markdown'),
    keyTakeaways: jsonb('key_takeaways').default([]).notNull(),
    glossary: jsonb('glossary').default([]).notNull(),
    actionItems: jsonb('action_items').default([]).notNull(),
    timeline: jsonb('timeline').default([]).notNull(),
    generatedAt: timestamp('generated_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const waitlist = pgTable('waitlist', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    name: varchar('name', { length: 255 }),
    source: varchar('source', { length: 100 }).default('landing'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Progress = typeof progress.$inferSelect;
export type NewProgress = typeof progress.$inferInsert;
export type QuestionAnswer = typeof questionAnswers.$inferSelect;
export type NewQuestionAnswer = typeof questionAnswers.$inferInsert;
export type TestResult = typeof testResults.$inferSelect;
export type NewTestResult = typeof testResults.$inferInsert;
export type FlashcardDeck = typeof flashcardDecks.$inferSelect;
export type NewFlashcardDeck = typeof flashcardDecks.$inferInsert;
export type ClassNote = typeof classNotes.$inferSelect;
export type NewClassNote = typeof classNotes.$inferInsert;
export type Waitlist = typeof waitlist.$inferSelect;
export type NewWaitlist = typeof waitlist.$inferInsert;
