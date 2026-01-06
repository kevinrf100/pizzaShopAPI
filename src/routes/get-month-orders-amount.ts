import { db } from '@/db/connections'
import { orders } from '@/db/schemas'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import dayjs from 'dayjs'
import { and, eq, gte, sql, sum } from 'drizzle-orm'
import Elysia from 'elysia'

export const getMonthOrdersAmount = new Elysia()
  .use(auth)
  .get('/month-orders-amount', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Only managers can view revenue.')
    }

    const startDate = dayjs()
    const lastMonth = startDate.subtract(1, 'month')
    const startOfLastMonth = lastMonth.startOf('month').toDate()

    const ordersPerMonth = await db
      .select({
        // When adding sql <string> we are telling typescript the value
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        // mapWith(Number) is used to convert the sum from string to number
        amount: sum(orders.totalCents).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfLastMonth),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const lastMonthWithYear = lastMonth.format('YYYY-MM')
    const currentMonthWithYear = startDate.format('YYYY-MM')

    const currentMonthAmount = ordersPerMonth.find((ordersPerMonth) => {
      return ordersPerMonth.monthWithYear === currentMonthWithYear
    })

    const lastMonthAmount = ordersPerMonth.find((ordersPerMonth) => {
      return ordersPerMonth.monthWithYear === lastMonthWithYear
    })

    const diffFromLastMonth =
      currentMonthAmount && lastMonthAmount
        ? (currentMonthAmount.amount * 100) / lastMonthAmount.amount
        : null

    return {
      amount: currentMonthAmount?.amount ?? 0,
      diffFromLastMonth: diffFromLastMonth
        ? Math.round(diffFromLastMonth - 100)
        : 0,
    }
  })
