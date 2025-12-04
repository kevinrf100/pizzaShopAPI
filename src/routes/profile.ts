import { db } from '@/db/connections'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import Elysia, { t } from 'elysia'

export const profile = new Elysia().use(auth).get(
  '/profile',
  async ({ getCurrentUser }) => {
    const { userId } = await getCurrentUser()

    const user = await db.query.users.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, userId)
      },
    })

    if (!user) {
      throw new UnauthorizedError()
    }

    return user
  },
  {
    cookie: t.Object({
      auth: t.String(),
    }),
  },
)
