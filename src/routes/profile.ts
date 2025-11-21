import { db } from '@/db/connections'
import { auth } from '@/http/auth'
import Elysia, { t } from 'elysia'

export const Profile = new Elysia().use(auth).get(
  '/me',
  async ({ getCurrentUser }) => {
    const { userId } = await getCurrentUser()

    const user = await db.query.users.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, userId)
      },
    })

    if (!user) {
      throw new Error('User not found.')
    }

    return user
  },
  {
    cookie: t.Object({
      auth: t.String(),
    }),
  },
)
