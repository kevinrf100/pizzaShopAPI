import { db } from '@/db/connections'
import { orders } from '@/db/schemas'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const dispatchOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/dispatch',
  async ({ params: { orderId }, getCurrentUser, set }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Only managers can dispatch orders.')
    }

    const order = await db.query.orders.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, orderId)
      },
    })

    if (!order) {
      set.status = 404
      return {
        message: 'Order not found or does not belong to your restaurant.',
      }
    }

    if (order.status !== 'PROCESSING') {
      set.status = 400
      return {
        message: 'Order is not in a processing state and cannot be dispatched.',
      }
    }

    await db
      .update(orders)
      .set({ status: 'DELIVERING' })
      .where(eq(orders.id, orderId))

    return order
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
