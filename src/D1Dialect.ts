import {
  CompiledQuery,
  DatabaseConnection,
  DatabaseIntrospector,
  Dialect,
  DialectAdapter,
  Driver,
  Kysely,
  QueryCompiler,
  QueryResult,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  TransactionSettings,
} from "kysely";

import type { D1Database, D1Result } from "@cloudflare/workers-types";
import {
  D1ExecuteError,
  ErrorWithCause,
  isErrorWithCause,
  NotImplementedError,
} from "./lib/errors";

export class D1Dialect implements Dialect {
  #config: D1DialectConfig;
  constructor(config: D1DialectConfig) {
    this.#config = config;
  }
  createDriver(): Driver {
    return new D1Driver(this.#config);
  }
  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler();
  }
  createAdapter(): DialectAdapter {
    return new SqliteAdapter();
  }
  createIntrospector(db: Kysely<unknown>): DatabaseIntrospector {
    return new SqliteIntrospector(db);
  }
}

export interface D1DialectConfig {
  // A D1 database binding
  database: D1Database;
}

class D1Driver implements Driver {
  #db?: D1Database;
  #connection?: D1Connection;
  #config: D1DialectConfig;

  constructor(config: D1DialectConfig) {
    this.#config = config;
  }
  async init() {
    this.#db = this.#config.database;
  }
  async acquireConnection(): Promise<DatabaseConnection> {
    if (this.#db) {
      this.#connection = new D1Connection(this.#db);
      return this.#connection;
    }

    throw new NotImplementedError(
      "Couldn't set up a D1 connection. Check that your D1 database is bound correctly."
    );
  }
  async beginTransaction(
    _connection: DatabaseConnection,
    _settings: TransactionSettings
  ) {
    throw new NotImplementedError("Transactions not supported on D1.");
  }
  async commitTransaction(_connection: DatabaseConnection) {
    throw new NotImplementedError("Transactions not supported on D1.");
  }
  async rollbackTransaction(_connection: DatabaseConnection) {
    throw new NotImplementedError("Transactions not supported on D1.");
  }
  async releaseConnection(_connection: DatabaseConnection) {
    return;
  }
  async destroy() {
    throw new NotImplementedError("Cannot destroy D1 database.");
  }
}

class D1Connection implements DatabaseConnection {
  #db: D1Database;
  constructor(db: D1Database) {
    this.#db = db;
  }

  async executeQuery<R>(compiledQuery: CompiledQuery): Promise<QueryResult<R>> {
    const { sql, parameters, query } = compiledQuery;
    const stmt = this.#db.prepare(sql);
    const boundStatements = stmt.bind(...parameters);

    let result: D1Result<unknown>;
    if (query.kind === "SelectQueryNode") {
      try {
        result = await boundStatements.all();
      } catch (e) {
        if (isErrorWithCause(e) && e.cause?.message) {
          throw new D1ExecuteError(e.cause.message);
        }
        throw new D1ExecuteError("Unknown error.");
      }
      if (result.error) {
        throw new D1ExecuteError(result.error);
      }
      return {
        rows: result.results as R[],
      };
    } else {
      try {
        result = await boundStatements.run();
      } catch (e) {
        if (isErrorWithCause(e) && e.cause?.message) {
          throw new D1ExecuteError(e.cause.message);
        }
        throw new D1ExecuteError("Unknown error.");
      }

      if (result.error) {
        throw new D1ExecuteError(result.error);
      }
      return {
        rows: [],
        numAffectedRows: result.meta.changes,
        insertId: result.meta.last_row_id,
      };
    }
  }

  streamQuery<R>(
    _compiledQuery: CompiledQuery<unknown>,
    _chunkSize?: number
  ): AsyncIterableIterator<QueryResult<R>> {
    throw new Error("Streaming queries are not supported by D1.");
  }
}
