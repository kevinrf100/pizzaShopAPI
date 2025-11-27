/* eslint-disable drizzle/enforce-delete-with-where */
import {
  authLinks,
  orderItems,
  orders,
  orderStatus,
  products,
  restaurants,
  users,
} from '@/db/schemas/index'
import { faker } from '@faker-js/faker'

import { createId } from '@paralleldrive/cuid2'
import chalk from 'chalk'
import type { InferEnum } from 'drizzle-orm'
import { db } from './connections'

// Delete all existing records
await Promise.allSettled([
  db.delete(users),
  db.delete(restaurants),
  db.delete(products),
  db.delete(orders),
  db.delete(orderItems),
  db.delete(authLinks),
])

console.log(chalk.yellow('✔︎ Database was cleared.'))

// Create new Customers user
const [user1, user2] = await db
  .insert(users)
  .values([
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
  ])
  .returning({ id: users.id })

console.log(chalk.green('🏄 Two customers was created successfully.'))

// Create Manager user
//  Will not user faker library to ensure the name and email
const [kevinManager, manager1] = await db
  .insert(users)
  .values([
    {
      name: 'Kevin R Fernandes',
      email: 'kevinrf@gmail.com',
      role: 'manager',
    },
    {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: 'manager',
    },
  ])
  .returning({ id: users.id })

console.log(chalk.green('🎫 Manager user was created successfully.'))

// Create Restaurant
const [restaurant1, restaurant2] = await db
  .insert(restaurants)
  .values([
    {
      name: faker.company.name(),
      description: faker.company.catchPhraseDescriptor(),
      managerId: kevinManager!.id,
    },
    {
      name: faker.company.name(),
      description: faker.company.catchPhraseDescriptor(),
      managerId: manager1!.id,
    },
  ])
  .returning()

console.log(chalk.green('🏪 Restaurants were created successfully.'))

const generateProducts = (
  minPrice: number,
  maxPrice: number,
  restaurantId: string,
) => {
  return {
    name: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    priceInCents: faker.number.int({ min: minPrice, max: maxPrice }),
    restaurantId,
  }
}

// Create Products
const availableProducts = await db
  .insert(products)
  .values([
    generateProducts(5, 100, restaurant1!.id),
    generateProducts(5, 300, restaurant1!.id),
    generateProducts(100, 250, restaurant2!.id),
    generateProducts(10, 400, restaurant2!.id),
  ])
  .returning()

console.log(chalk.green('🍕 Products were created successfully.'))

// Create Orders and Order Items
// Typing helpers to infer the insert types from db Schemas
type OrderItemsToInsert = typeof orderItems.$inferInsert
type OrderToInsert = typeof orders.$inferInsert
// Strongly typed status from the orders schema
type OrderStatus = InferEnum<typeof orderStatus>

// Enum values coming from the pgEnum used by orders.status
const orderStatusArray: OrderStatus[] = orderStatus.enumValues

// Arrays to bulk insert later
const ordersToInsert: OrderToInsert[] = []
const orderItemsToInsert: OrderItemsToInsert[] = []

for (let i = 0; i < 10; i++) {
  const orderId = createId()

  // This faker function selects random products for the order
  const orderProducts = faker.helpers.arrayElements(availableProducts, {
    min: 1,
    max: 3,
  })

  let totalCents = 0

  orderProducts.forEach((product) => {
    const quantity = faker.number.int({ min: 1, max: 5 })

    totalCents += product.priceInCents * quantity

    orderItemsToInsert.push({
      orderId,
      productId: product.id,
      quantity,
      priceInCents: product.priceInCents,
    })
  })

  ordersToInsert.push({
    // Using faker to randomly select a customer for the order
    customerId: faker.helpers.arrayElement([user1!.id, user2!.id]),
    // Using faker to randomly select a restaurant for the order
    restaurantId: faker.helpers.arrayElement([
      restaurant1!.id,
      restaurant2!.id,
    ]),
    totalCents,
    status: faker.helpers.arrayElement(orderStatusArray),
    // Will set createdAt to a recent date within the last 40 days
    createdAt: faker.date.recent({ days: 40 }),
  })
}

await db.insert(orders).values(ordersToInsert)
console.log(chalk.green('🧾 Orders were created successfully.'))

await db.insert(orderItems).values(orderItemsToInsert)
console.log(chalk.green('🍽️ Order items were created successfully.'))

console.log(chalk.greenBright(' ✔︎ Seed process completed successfully.'))

process.exit()
