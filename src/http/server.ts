import { env } from '@/env'
import { approveOrder } from '@/routes/approve-order'
import { authenticateFromLink } from '@/routes/authenticate-from-link'
import { getOrderDetails } from '@/routes/get-order-details'
import { managedRestaurant } from '@/routes/managed-restaurants'
import { profile } from '@/routes/profile'
import { registerRestaurants } from '@/routes/register-restaurants'
import { sendAuthLink } from '@/routes/send-auth-link'
import { signOut } from '@/routes/sign-out'
import chalk from 'chalk'
import { Elysia } from 'elysia'

const app = new Elysia()
  .use(registerRestaurants)
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(signOut)
  .use(authenticateFromLink)
  .use(profile)
  .use(managedRestaurant)
  .use(getOrderDetails)
  .use(approveOrder)
  // Creating a global error handler to catch validation errors
  .onError(({ error, code, set }) => {
    switch (code) {
      // Handle validation errors
      case 'VALIDATION':
        set.status = error.status || 400
        return error.toResponse()
      default:
        // Handle other errors (500 Internal Server Error) - Unexpected errors
        set.status = 500
        console.error(error)
        return new Response('Internal Server Error', { status: 500 })
    }
  })

app.listen(env.PORT, () => {
  console.log(chalk.green('🔥 HTTP Server started'))
})
