import { orderItems } from '@/db/schemas/order-items'
import { restaurants } from '@/db/schemas/restaurants'
import { users } from '@/db/schemas/users'
import { createId } from '@paralleldrive/cuid2'
import { relations } from 'drizzle-orm'
import { integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const orderStatus = pgEnum('order_status', [
  'PENDING',
  'PROCESSING',
  'DELIVERING',
  'DELIVERED',
  'CANCELLED',
])

export const orders = pgTable('orders', {
  id: text('id')
    .$defaultFn(() => createId())
    .primaryKey(),
  // Set null on delete to keep order history
  // important for audits and dashboards
  customerId: text('customer_id').references(() => users.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  restaurantId: text('restaurant_id')
    .notNull()
    .references(() => restaurants.id, { onDelete: 'cascade' }),
  status: orderStatus('status').notNull().default('PENDING'),
  // Avoiding joins to create reports faster
  totalCents: integer('total_cents').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const ordersRelations = relations(orders, ({ one, many }) => {
  return {
    customer: one(users, {
      fields: [orders.customerId],
      references: [users.id],
      relationName: 'orders_customer',
    }),
    restaurant: one(restaurants, {
      fields: [orders.restaurantId],
      references: [restaurants.id],
      relationName: 'orders_restaurant',
    }),
    orderItems: many(orderItems),
  }
})
