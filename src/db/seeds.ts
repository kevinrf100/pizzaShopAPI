/* eslint-disable drizzle/enforce-delete-with-where */
import { restaurants, users } from '@/db/schemas/index'
import { faker } from '@faker-js/faker'

import chalk from 'chalk'
import { db } from './connections'

// Delete all existing records
await db.delete(users)
await db.delete(restaurants)

console.log(chalk.yellow('✔︎ Database was cleared.'))

// Create new Customers user
await db.insert(users).values([
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
  },
  {
    name: faker.person.fullName(),
    email: faker.internet.email(),
  },
])

console.log(chalk.green('🏄 Two customers was created successfully.'))

// Create Manager user - Will not user faker library to ensure the name and email
const [manager] = await db.insert(users).values([
  {
    name: 'Kevin R Fernandes',
    email: 'kevinrf@gmail.com',
    role: 'manager',
  },
],
).returning({ id: users.id })

console.log(chalk.green('🎫 Manager user was created successfully.'))

// Create Restaurant
await db.insert(restaurants).values([
  {
    name: faker.company.name(),
    description: faker.company.catchPhraseDescriptor(),
    managerId: manager!.id,
  },
])

console.log(chalk.green('🎫 Manager user was created successfully.'))

console.log(chalk.green(' ✔︎ Seed process completed successfully.'))

process.exit()
