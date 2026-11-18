<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## 本项目硬约束（覆盖 Next.js 文档与其它 skill 中的 RSC / Server Actions 建议）

本项目是 Next.js 前后端分离 SPA。与 `node_modules/next/dist/docs/`、vercel-react-best-practices 等冲突时，**以本节为准**。

1. Root `src/app/layout.tsx` 保持 Server Component：只放 html/body、metadata、font、`globals.css`、client Providers。禁止 `'use client'`，禁止在 layout 拉数。
2. 每个 `page.tsx` 为 `'use client'`，用 `clientOnly(() => import(该页组件))` 挂载；禁止 `await` 数据库或服务端 fetch。不要把首页 `app-shell` 复用到其它路由。
3. `src/components/**` 与 shadcn 组件第一行 `'use client'`。
4. 技术栈：TypeScript + React + Tailwind v4 + shadcn/ui；API 只用 Route Handler；数据库只用 Drizzle + Neon Postgres；客户端拉数用 TanStack Query + `src/lib/api.ts`。
5. 包管理器默认 pnpm。不要新建 `tailwind.config.*`。

### 禁止

- `'use server'`、Server Actions、Server Components 拉数、`getServerSideProps`、Pages Router
- `output: 'export'`、`cacheComponents: true`
- 客户端 import `src/db/**` 或 `drizzle-orm`
- 给 `route.ts` / `drizzle.config.ts` / `src/db/**` 加 `'use client'`
- 默认再装 Ant Design / MUI / Chakra
- React Router 或 `app/[[...slug]]`（除非用户明确要求）
- 用 `cookies()` / `headers()` / `revalidatePath` / `use()` 给页面供数
- neon-http 上调用 `db.transaction()`

### 必须

- UI 数据只通过浏览器 `fetch('/api/...')` 或 `src/lib/api.ts`
- API 只放 `src/app/api/**/route.ts`，导出 GET/POST/PUT/PATCH/DELETE，JSON；错误 `{ "error": "..." }`；DB 用 `getDb()`
- shadcn：`components.json` 中 `"rsc": false`；基础控件用 `src/components/ui/` + `cn()`
- `DATABASE_URL` 只出现在服务端（`.env.local`、Route Handler、Drizzle）
- Kit 读 `.env.local`；migrate 优先 `DATABASE_URL_UNPOOLED`；没有真实表和非空 URL 时不跑 Kit

## Agent skills

### Issue tracker

工单以本地 markdown 存放在 `.scratch/<feature>/`。See `docs/agents/issue-tracker.md`.

### Triage labels

使用默认五类标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。See `docs/agents/triage-labels.md`.

### Domain docs

single-context：根目录 `GLOSSARY.md` 与 `docs/adr/`。See `docs/agents/domain.md`.
