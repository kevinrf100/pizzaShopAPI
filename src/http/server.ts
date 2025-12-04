import { env } from '@/env'
import { approveOrder } from '@/routes/approve-order'
import { authenticateFromLink } from '@/routes/authenticate-from-link'
import { cancelOrder } from '@/routes/cancel-order'
import { deliverOrder } from '@/routes/deliver-order'
import { dispatchOrder } from '@/routes/dispatch-order'
import { getMonthRevenue } from '@/routes/get-month-revenue'
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
  .use(cancelOrder)
  .use(dispatchOrder)
  .use(deliverOrder)
  .use(getMonthRevenue)
  // Creating a global error handler to catch validation errors
  .onError(({ error, code, set }) => {
    switch (code) {
      // Handle validation errors
      case 'VALIDATION':
        set.status = error.status || 400
        return error.toResponse()
      case 'NOT_FOUND':
        set.status = 404
        return new Response('Resource Not Found', { status: 404 })
      default:
        // Handle other errors (500 Internal Server Error) - Unexpected errors
        set.status = 500
        return new Response('Internal Server Error', { status: 500 })
    }
  })

app.listen(env.PORT, () => {
  console.log(chalk.green('🔥 HTTP Server started'))
})
