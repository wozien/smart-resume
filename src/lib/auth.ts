import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import { getDb } from '@/db'
import * as schema from '@/db/schema'

function createAuth() {
  return betterAuth({
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        if (process.env.NODE_ENV !== 'production') {
          console.info(`[reset-password] ${user.email} ${url}`)
          return
        }
        throw new Error('邮件服务未配置')
      },
    },
    session: {
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    plugins: [nextCookies()],
  })
}

let authInstance: ReturnType<typeof createAuth> | undefined

export function getAuth() {
  if (!authInstance) authInstance = createAuth()
  return authInstance
}

export const auth = new Proxy({} as ReturnType<typeof createAuth>, {
  get(_target, property, receiver) {
    const value = Reflect.get(getAuth(), property, receiver)
    return typeof value === 'function' ? value.bind(getAuth()) : value
  },
})
