# kysely-cloudflare-d1

A Kysely dialect for [Cloudflare D1](https://developers.cloudflare.com/d1/).

## Limitations

- This does not support transactions as Cloudflare D1 does not support transactions in its public API.
- This was built for working with Cloudflare Page Functions but should work with Cloudflare Workers generally.

## Usage

Declare a [D1 binding](https://developers.cloudflare.com/pages/platform/functions/bindings/#d1-databases) to your database. This will also work with locally defined bindings.

### Page function

An example of using it in a page function.
You may need to define a `worker-configuration.d.ts` in your `/functions` directory to set the binding in Typescript.

```typescript
// /functions/worker-configuration.d.ts
interface Env {
  DB: D1Database;
}
```

```typescript
// /functions/index.ts (or any function)
import { D1Dialect } from "@gawdn/kysely-cloudflare-d1";
import { Kysely } from "kysely";

export const onRequest: PagesFunction<Env, string, any> = async ({
  params,
  env,
}): Promise<Response> => {
  const db = new Kysely<any>({
    dialect: new D1Dialect({
      database: env.DB,
    }),
  });
  // Use Kysely the same way you usually would.
  await db.insertInto("users").values({ user_name: "Jam" }).execute();
  const users = await db.selectFrom("users").selectAll().execute();
  return new Response(JSON.stringify(users), { status: 200 });
});
```

### Worker

An example of using it in a worker.

```typescript
// /src/index.ts
import { D1Dialect } from "@gawdn/kysely-cloudflare-d1";
import { Kysely } from "kysely";

export interface Env {
  DB: D1Database;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const db = new Kysely<any>({
      dialect: new D1Dialect({
        database: env.DB,
      }),
    });
    // Use Kysely the same way you usually would.
    await db.insertInto("users").values({ user_name: "Jam" }).execute();
    const users = await db.selectFrom("users").selectAll().execute();
    return new Response(JSON.stringify(users), { status: 200 });
  },
};
```

### Local usage

Define a [binding](https://developers.cloudflare.com/d1/get-started/#4-bind-your-worker-to-your-d1-database) in your `wrangler.toml` in your top-level directory.

```toml
[[ d1_databases ]]
binding = "DB" # i.e. available in your Worker on env.DB
database_name = "database"
database_id = ""
```
