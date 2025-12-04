/* eslint-disable @stylistic/multiline-ternary */
import { db } from '@/db/connections'
import { orders, users } from '@/db/schemas'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import { and, count, desc, eq, ilike, sql } from 'drizzle-orm'
import { createSelectSchema } from 'drizzle-typebox'
import Elysia, { t } from 'elysia'

export const getOrders = new Elysia().use(auth).get(
  '/orders',
  async ({
    getCurrentUser,
    query: { customerName, orderId, status, pageIndex },
  }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Only managers can view orders.')
    }

    const baseQuery = db
      .select({
        orderId: orders.id,
        createdAt: orders.createdAt,
        status: orders.status,
        total: orders.totalCents,
        customerName: users.name,
      })
      .from(orders)
      .innerJoin(users, eq(orders.customerId, users.id))
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          orderId ? ilike(orders.id, `%${orderId}%`) : undefined,
          customerName ? ilike(users.name, `%${customerName}%`) : undefined,
          status ? eq(orders.status, status) : undefined,
        ),
      )

    const [amountOfOrdersQuery, ordersQuery] = await Promise.all([
      db.select({ count: count() }).from(baseQuery.as('totalCount')),
      db
        .select()
        .from(baseQuery.as('orders'))
        .offset(pageIndex * 10)
        .limit(10)
        .orderBy((fields) => {
          return [
            sql`CASE ${fields.status} 
              WHEN 'PENDING' THEN 1
              WHEN 'PROCESSING' THEN 2
              WHEN 'DELIVERING' THEN 3
              WHEN 'DELIVERED' THEN 4
              WHEN 'CANCELLED' THEN 5
            END`,
            desc(fields.createdAt),
          ]
        }),
    ])

    const amountOfOrders = amountOfOrdersQuery[0]?.count ?? 0

    return {
      orders: ordersQuery,
      meta: { pageIndex, perPage: 10, totalCount: amountOfOrders },
    }
  },
  {
    query: t.Object({
      customerName: t.Optional(t.String()),
      orderId: t.Optional(t.String()),
      status: t.Optional(createSelectSchema(orders).properties.status),
      pageIndex: t.Number({ default: 0, minimum: 0 }),
    }),
    cookie: t.Object({
      auth: t.String(),
    }),
  },
)
