import { db } from '@/db/connections'
import { orders } from '@/db/schemas'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const deliverOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/deliver',
  async ({ params: { orderId }, getCurrentUser, set }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Only managers can deliver orders.')
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

    if (order.status !== 'DELIVERING') {
      set.status = 400
      return {
        message: 'Order is not in a delivering state.',
      }
    }

    await db
      .update(orders)
      .set({ status: 'DELIVERED' })
      .where(eq(orders.id, orderId))

    return order
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
