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
  #db: D1Database;
  #connection: D1Connection;
  #config: D1DialectConfig;

  constructor(config: D1DialectConfig) {
    this.#config = config;
  }

  async init() {
    this.#db = this.#config.database;
  }
  async acquireConnection(): Promise<DatabaseConnection> {
    this.#connection = new D1Connection(this.#db);
    return this.#connection;
  }

  async beginTransaction(
    _connection: DatabaseConnection,
    _settings: TransactionSettings
  ) {
    throw new Error("Transactions not supported on D1.");
  }
  async commitTransaction(_connection: DatabaseConnection) {
    throw new Error("Transactions not supported on D1.");
  }
  async rollbackTransaction(_connection: DatabaseConnection) {
    throw new Error("Transactions not supported on D1.");
  }
  async releaseConnection(_connection: DatabaseConnection) {
    return;
  }
  async destroy() {
    throw new Error("Cannot destroy D1 database.");
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

    if (query.kind === "SelectQueryNode") {
      const result = await boundStatements.all();
      return {
        rows: result.results as R[],
      };
    } else {
      const result = await boundStatements.run();
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
