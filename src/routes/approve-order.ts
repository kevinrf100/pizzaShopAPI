import { db } from '@/db/connections'
import { orders } from '@/db/schemas'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const approveOrder = new Elysia().use(auth).patch(
  '/orders/:orderId/approve',
  async ({ params: { orderId }, getCurrentUser, set }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Managers cannot approve orders.')
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

    if (order.status !== 'PENDING') {
      set.status = 400
      return {
        message: 'Order is not in a pending state and cannot be approved.',
      }
    }

    await db
      .update(orders)
      .set({ status: 'PROCESSING' })
      .where(eq(orders.id, orderId))

    return order
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
