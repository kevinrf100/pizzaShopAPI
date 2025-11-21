import { db } from '@/db/connections'
import { restaurants, users } from '@/db/schemas'
import chalk from 'chalk'
import Elysia, { t } from 'elysia'

export const registerRestaurants = new Elysia()
  .post('/restaurants', async ({ body, set }) => {
    const { restaurantName, managerName, email, phone } = body

    const [manager] = await db.insert(users).values({
      name: managerName,
      email,
      phone,
      role: 'manager',
    }).returning({ id: users.id })

    console.log(chalk.green(`✅ Manager ${manager!.id} created with success`))

    await db.insert(restaurants).values({
      name: restaurantName,
      managerId: manager!.id,
    }).returning()

    console.log(chalk.green('✅ Restaurant created with success'))

    set.status = 204
  }, {
    body: t.Object({
      restaurantName: t.String(),
      managerName: t.String(),
      email: t.String({ format: 'email' }),
      phone: t.String(),
    },
    ),
  })
