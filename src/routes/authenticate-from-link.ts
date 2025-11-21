import { db } from '@/db/connections'
import { authLinks } from '@/db/schemas'
import { auth } from '@/http/auth'
import dayjs from 'dayjs'
import { eq } from 'drizzle-orm'
import Elysia, { t } from 'elysia'

export const authenticateFromLink = new Elysia().use(auth).get(
  '/auth-links/authenticate',
  async ({ query: { code, redirect: redirectUrl }, signInUser, redirect }) => {
    const authLinkFromCode = await db.query.authLinks.findFirst({
      where(fields, { eq }) {
        return eq(fields.code, code)
      },
    })

    if (!authLinkFromCode) {
      throw new Error('Invalid or expired authentication link')
    }

    const daysSinceAuthLinkWasCreated = dayjs().diff(
      authLinkFromCode.createdAt,
      'day',
    )

    if (daysSinceAuthLinkWasCreated > 7) {
      throw new Error('Authentication link has expired')
    }

    const managedRestaurant = await db.query.restaurants.findFirst({
      where(fields, { eq }) {
        return eq(fields.managerId, authLinkFromCode.userId)
      },
    })

    await signInUser({
      sub: authLinkFromCode.userId,
      restaurantId: managedRestaurant?.id,
    })

    await db.delete(authLinks).where(eq(authLinks.id, authLinkFromCode.id))

    redirect(redirectUrl)
  },
  {
    query: t.Object({
      code: t.String(),
      redirect: t.String({ format: 'uri' }),
    }),
  },
)
