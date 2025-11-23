import { db } from '@/db/connections'
import { auth } from '@/http/auth'
import Elysia from 'elysia'

export const managedRestaurant = new Elysia()
  .use(auth)
  .get('/managed-restaurants', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new Error('User is not a manager of any restaurant')
    }

    const managedRestaurant = await db.query.restaurants.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, restaurantId)
      },
    })
    return managedRestaurant
  })
