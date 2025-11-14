import * as schema from '@/db/schemas/index'
import { env } from '@/env'
import { drizzle } from 'drizzle-orm/node-postgres'

const db = drizzle({
  connection: {
    connectionString: env.DATABASE_URL!,
  },
  schema,
})

export { db }
