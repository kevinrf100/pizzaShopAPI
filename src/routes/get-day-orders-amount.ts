import { db } from '@/db/connections'
import { orders } from '@/db/schemas'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import dayjs from 'dayjs'
import { and, count, eq, gte, sql, sum } from 'drizzle-orm'
import Elysia from 'elysia'

export const getDayOrdersAmount = new Elysia()
  .use(auth)
  .get('/day-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Only managers can view revenue.')
    }

    const today = dayjs()
    const yesterday = today.subtract(1, 'day')
    const startOfYesterday = yesterday.startOf('day').toDate()

    const ordersPerDay = await db
      .select({
        // When adding sql <string> we are telling typescript the value
        dayWithMonthAndYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
        // mapWith(Number) is used to convert the sum from string to number
        revenue: sum(orders.totalCents).mapWith(Number),
        amount: count(),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfYesterday),
          eq(orders.status, 'DELIVERED'),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)

    const todayWithMonthAndYear = today.format('YYYY-MM-DD')
    const yesterdayWithMonthAndYear = yesterday.format('YYYY-MM-DD')

    const todayOrdersAmount = ordersPerDay.find((ordersPerDay) => {
      return ordersPerDay.dayWithMonthAndYear === todayWithMonthAndYear
    })

    const yesterdayOrdersAmount = ordersPerDay.find((ordersPerDay) => {
      return ordersPerDay.dayWithMonthAndYear === yesterdayWithMonthAndYear
    })

    const diffFromYesterday =
      todayOrdersAmount && yesterdayOrdersAmount
        ? (todayOrdersAmount.amount * 100) / yesterdayOrdersAmount.amount
        : null

    return {
      revenue: todayOrdersAmount?.revenue ?? 0,
      amount: todayOrdersAmount?.amount ?? 0,
      diffFromYesterday: diffFromYesterday
        ? Math.round(diffFromYesterday - 100)
        : 0,
    }
  })
