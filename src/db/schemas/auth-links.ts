import { users } from '@/db/schemas/users'
import { createId } from '@paralleldrive/cuid2'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm/relations'

export const authLinks = pgTable('auth_links', {
  id: text('id').notNull().primaryKey().$defaultFn(() => createId()),
  code: text('code').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const authLinksRelations = relations(authLinks, ({ one }) => {
  return {
    manager: one(users, {
      fields: [authLinks.userId],
      references: [users.id],
      relationName: 'auth_links_user',
    }),
  }
})
