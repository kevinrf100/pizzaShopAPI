import { signOut } from '@/db/schemas/sign-out'
import { env } from '@/env'
import { authenticateFromLink } from '@/routes/authenticate-from-link'
import { registerRestaurants } from '@/routes/register-restaurants'
import { sendAuthLink } from '@/routes/send-auth-link'
import chalk from 'chalk'
import { Elysia } from 'elysia'

const app = new Elysia()
  .use(registerRestaurants)
  .use(sendAuthLink)
  .use(authenticateFromLink)
  .use(signOut)

app.listen(env.PORT, () => {
  console.log(chalk.green('🔥 HTTP Server started'))
})
