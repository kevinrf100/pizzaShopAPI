import { db } from '@/db/connections'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import Elysia, { t } from 'elysia'

export const getOrderDetails = new Elysia().use(auth).get(
  '/orders/:orderId',
  async ({ params: { orderId }, getCurrentUser, set }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Managers cannot access order details.')
    }

    const orderDetails = await db.query.orders.findFirst({
      // Select only necessary order fields
      columns: {
        id: true,
        createdAt: true,
        status: true,
        totalCents: true,
      },
      // Used to retrieve related customer and restaurant details
      with: {
        customer: {
          // Filter columns to only include necessary customer info
          columns: {
            name: true,
            email: true,
            phone: true,
          },
        },
        orderItems: {
          columns: {
            quantity: true,
            id: true,
            priceInCents: true,
          },
          // Another join to get product details for each order item
          with: {
            product: {
              columns: {
                name: true,
                description: true,
                priceInCents: true,
              },
            },
          },
        },
      },
      where(fields, { eq }) {
        return eq(fields.id, orderId)
      },
    })

    if (!orderDetails) {
      set.status = 404
      return { message: 'Order not found' }
    }

    return orderDetails
  },
  {
    params: t.Object({
      orderId: t.String(),
    }),
  },
)
