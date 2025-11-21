import { env } from '@/env'
import jwt from '@elysiajs/jwt'
import Elysia, { t, type Static } from 'elysia'

// When creating the JWT schema, we can define the shape of the payload
// Helps TypeScript understand what properties are available in the payload

const jwtSchema = t.Object({
  // Sub = Subject
  // (usually the user ID or unique identifier from the user token)
  sub: t.String(),
  // It's options, because can be a manager
  restaurantId: t.Optional(t.String()),
})

export const auth = new Elysia()
  .use(
    jwt({
      secret: env.JWT_SECRET,
      schema: jwtSchema,
    }),
  )
  .resolve(
    {
      as: 'scoped',
    },
    ({ jwt: { sign, verify }, cookie: { auth } }) => {
      return {
        signInUser: async (payload: Static<typeof jwtSchema>) => {
          const token = await sign(payload)

          auth!.value = token
          auth!.httpOnly = true
          auth!.maxAge = 60 * 60 * 24 * 7 /* 7 days */
          auth!.path = '/'
        },
        signOutUser: () => {
          auth!.remove()
        },
        getCurrentUser: async () => {
          const payload = await verify(auth!.value as string)

          if (!payload) {
            throw new Error('Unauthorized.')
          }

          return {
            userId: payload.sub,
            restaurantId: payload.restaurantId,
          }
        },
      }
    },
  )
