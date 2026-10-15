# Shareable

Host `.html` files for signed-in users, and share each page behind a keypass.

## Local development

Postgres is expected at `DATABASE_URL`. A Neon connection string (host ending in `neon.tech`) uses the Neon serverless driver. Any other Postgres URL uses a normal Postgres connection, which is what local Docker uses.

```bash
docker run -d --name shareable-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=shareable \
  -p 5432:5432 postgres:16

cp .env.example .env
# Fill in DATABASE_URL and a long random BETTER_AUTH_SECRET

npm run db:push
npm run dev
```

## Neon on Vercel

Sign in with the Vercel CLI, link this project, and add the Neon integration so `DATABASE_URL` is provisioned:

```bash
npx vercel login
npx vercel link
npx vercel integration add neon
npx vercel env pull .env --yes
```

Also set `BETTER_AUTH_SECRET` (32+ random bytes) and `BETTER_AUTH_URL` (the public app URL) for Development, Preview, and Production.
