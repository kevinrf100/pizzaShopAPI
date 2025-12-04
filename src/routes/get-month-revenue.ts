import { db } from '@/db/connections'
import { orders } from '@/db/schemas'
import { auth } from '@/http/auth'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import dayjs from 'dayjs'
import { and, eq, gte, sql, sum } from 'drizzle-orm'
import Elysia from 'elysia'

export const getMonthRevenue = new Elysia()
  .use(auth)
  .get('/month-revenue', async ({ getCurrentUser }) => {
    const { restaurantId } = await getCurrentUser()

    if (!restaurantId) {
      throw new UnauthorizedError('Only managers can view revenue.')
    }

    const startDate = dayjs()
    const lastMonth = startDate.subtract(1, 'month')
    const startOfLastMonth = lastMonth.startOf('month').toDate()

    const monthRevenue = await db
      .select({
        // When adding sql <string> we are telling typescript the value
        monthWithYear: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`,
        // mapWith(Number) is used to convert the sum from string to number
        revenue: sum(orders.totalCents).mapWith(Number),
      })
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, startOfLastMonth),
          eq(orders.status, 'DELIVERED'),
        ),
      )
      .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM')`)

    const lastMonthWithYear = lastMonth.format('YYYY-MM')
    const currentMonthWithYear = startDate.format('YYYY-MM')

    const currentMonthRevenue = monthRevenue.find((monthRevenue) => {
      return monthRevenue.monthWithYear === currentMonthWithYear
    })

    const lastMonthRevenue = monthRevenue.find((monthRevenue) => {
      return monthRevenue.monthWithYear === lastMonthWithYear
    })

    const diffFromLastMonth =
      currentMonthRevenue && lastMonthRevenue
        ? (currentMonthRevenue.revenue * 100) / lastMonthRevenue.revenue
        : null

    return {
      revenue: currentMonthRevenue?.revenue ?? 0,
      diffFromLastMonth: diffFromLastMonth
        ? Math.round(diffFromLastMonth - 100)
        : 0,
    }
  })
