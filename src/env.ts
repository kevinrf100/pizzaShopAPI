import z from 'zod'

const envSchema = z.object({
  PORT: z.string().default('3000').transform((value) => Number(value)),
  DATABASE_URL: z.url(),
})

export const env = envSchema.parse(process.env)
