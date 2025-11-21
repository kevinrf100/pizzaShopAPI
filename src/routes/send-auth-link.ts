import { db } from '@/db/connections'
import { authLinks } from '@/db/schemas'
import { env } from '@/env'
import { createId } from '@paralleldrive/cuid2'
import Elysia, { t } from 'elysia'

export const sendAuthLink = new Elysia().post(
  '/send-auth-link',
  async ({ body, set }) => {
    const { email } = body

    // Used to make complex query
    // const [userFromEmail] = await db.select()
    //   .from(users)
    //   .where(eq(users.email, email))
    //   .limit(1)

    // Using query builder
    // Similar to Prisma's findFirst
    // where(fields, operators) => boolean
    const userFromEmail = await db.query.users.findFirst({
      where(fields, { eq }) {
        return eq(fields.email, email)
      },
    })

    if (!userFromEmail) {
      throw new Error('User not found')
    }

    const authLinkCode = createId()

    await db.insert(authLinks).values({
      code: authLinkCode,
      userId: userFromEmail!.id,
    })

    const authLinkUrl = new URL('/auth-links/authenticate/', env.API_BASE_URL)
    authLinkUrl.searchParams.set('code', authLinkCode)
    authLinkUrl.searchParams.set('redirect', env.AUTH_REDIRECT_URL)

    console.log(`Auth link for ${email}: ${authLinkUrl.toString()}`)

    // Sending email logic would be here
    set.status = 204
  },
  {
    body: t.Object({
      email: t.String({ format: 'email' }),
    }),
  },
)
