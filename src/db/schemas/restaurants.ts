import { orders } from '@/db/schemas/orders'
import { products } from '@/db/schemas/products'
import { users } from '@/db/schemas/users'
import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const restaurants = pgTable('restaurants', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text('name').notNull(),
  description: text('phone'),
  managerId: text('manager_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAy: timestamp('updated_at').notNull().defaultNow(),
})

// This is only user by drizzle application to understand the relation
// it will not create a new migration or anything inside DB
export const restaurantsRelations = relations(restaurants, ({ one, many }) => {
  return {
    manager: one(users, {
      fields: [restaurants.managerId],
      references: [users.id],
      relationName: 'restaurantes_manager',
    }),
    // For many relations we don't need to specify fields and references
    // We can set only the relation name, but it's optional
    // If not set, drizzle will generate one automatically
    orders: many(orders),
    products: many(products),
  }
})
