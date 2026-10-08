import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'
export const rsvps = sqliteTable('rsvps', { id: text('id').primaryKey(), name: text('name').notNull(), attendance: text('attendance').notNull(), guests: integer('guests').notNull(), message: text('message').notNull(), createdAt: text('created_at').notNull() })
