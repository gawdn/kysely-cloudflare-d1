# kysely-cloudflare-d1

A Kysely dialect for [Cloudflare D1](https://developers.cloudflare.com/d1/).

# Limitations

- This does not support transactions as Cloudflare D1 does not support transactions in its' public API.
- This was built for working with Cloudflare Page Functions but should work with Cloudflare Workers generally.

# Usage

You must declare a [D1 binding](https://developers.cloudflare.com/pages/platform/functions/bindings/#d1-databases) to your database. This will also work with locally defined bindings.

An example of using it in a page function.

```typescript
import { D1Dialect } from "@gawdn/kysely-cloudflare-d1";

export const onRequest: PagesFunction<Env, string, any> = async ({
  params,
  env,
}): Promise<Response> => {
  const db = new Kysely({
    dialect: new D1Dialect({
      database: env.DB,
    }),
  });

  const user = await db
      .selectFrom("users")
      .selectAll()
      .where("users.user_id", "=", "test")
      .execute();
  return new Response(JSON.stringify(user), {status: 200});
});
```

## Local usage

Define a `worker-configuration.d.ts` in your `/functions` directory.

```typescript
interface Env {
  DB: D1Database;
}
```

and a binding in your `wrangler.toml` in your top-level directory.

```toml
[[ d1_databases ]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "database"
database_id = ""
```
