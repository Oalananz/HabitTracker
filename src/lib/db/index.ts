// Server-only — never import from client components.
//
// Thin PostgreSQL access layer. It exposes a small chainable query builder
// (`db.from(table).select().eq()…`, `db.rpc(fn, params)`) whose results are
// always `{ data, error, count }` and never throw, so service code reads the
// same whether a query succeeds or fails. Everything is compiled to
// parameterised SQL; identifiers are validated against the live schema.
import { Pool, types } from 'pg';
import type { Database } from '@/lib/database.types';

// ─── Type parsing ────────────────────────────────────────────────────
// Match JSON-API conventions the app was written against: dates stay as
// 'YYYY-MM-DD' strings, timestamps become ISO strings, numerics become numbers.
const parseTimestamptz = types.getTypeParser(types.builtins.TIMESTAMPTZ);
types.setTypeParser(types.builtins.DATE, (v) => v);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => {
  const d = parseTimestamptz(v) as Date;
  return Number.isNaN(d.getTime()) ? v : d.toISOString();
});
types.setTypeParser(types.builtins.TIMESTAMP, (v) => v.replace(' ', 'T'));
types.setTypeParser(types.builtins.NUMERIC, (v) => parseFloat(v));
types.setTypeParser(types.builtins.INT8, (v) => Number(v));

// ─── Pool ────────────────────────────────────────────────────────────
const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
  pgSchema: Promise<SchemaInfo> | undefined;
};

// IANA zone names only (e.g. Asia/Amman); anything else falls back to UTC.
const DB_TIMEZONE = /^[A-Za-z0-9_+\-/]+$/.test(process.env.TZ || '') ? process.env.TZ! : 'UTC';

function createPool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_SIZE || 10),
    // Keep SQL date math (NOW()::date etc.) on the same calendar as the app.
    options: `-c timezone=${DB_TIMEZONE}`,
  });
}

export const pool: Pool = globalForDb.pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalForDb.pgPool = pool;

// ─── Schema introspection (cached) ───────────────────────────────────
interface SchemaInfo {
  columns: Map<string, Map<string, string>>; // table -> column -> data_type
  primaryKeys: Map<string, string[]>;
  foreignKeys: { table: string; column: string; refTable: string; refColumn: string }[];
}

async function loadSchema(): Promise<SchemaInfo> {
  const [cols, pks, fks] = await Promise.all([
    pool.query<{ table_name: string; column_name: string; data_type: string }>(
      `SELECT table_name, column_name, data_type
         FROM information_schema.columns WHERE table_schema = 'public'`
    ),
    pool.query<{ table_name: string; columns: string[] }>(
      `SELECT cl.relname AS table_name, array_agg(a.attname ORDER BY a.attnum)::text[] AS columns
         FROM pg_index i
         JOIN pg_class cl ON cl.oid = i.indrelid
         JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indisprimary AND cl.relnamespace = 'public'::regnamespace
        GROUP BY cl.relname`
    ),
    pool.query<{ table_name: string; column_name: string; ref_table: string; ref_column: string }>(
      `SELECT cl.relname AS table_name, a.attname AS column_name,
              rcl.relname AS ref_table, ra.attname AS ref_column
         FROM pg_constraint c
         JOIN pg_class cl ON cl.oid = c.conrelid
         JOIN pg_class rcl ON rcl.oid = c.confrelid
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
         JOIN pg_attribute ra ON ra.attrelid = c.confrelid AND ra.attnum = c.confkey[1]
        WHERE c.contype = 'f' AND cl.relnamespace = 'public'::regnamespace`
    ),
  ]);

  const columns = new Map<string, Map<string, string>>();
  for (const r of cols.rows) {
    if (!columns.has(r.table_name)) columns.set(r.table_name, new Map());
    columns.get(r.table_name)!.set(r.column_name, r.data_type);
  }
  return {
    columns,
    primaryKeys: new Map(pks.rows.map((r) => [r.table_name, r.columns])),
    foreignKeys: fks.rows.map((r) => ({
      table: r.table_name, column: r.column_name, refTable: r.ref_table, refColumn: r.ref_column,
    })),
  };
}

function getSchema(): Promise<SchemaInfo> {
  if (!globalForDb.pgSchema) {
    globalForDb.pgSchema = loadSchema().catch((err) => {
      globalForDb.pgSchema = undefined; // retry on next call
      throw err;
    });
  }
  return globalForDb.pgSchema;
}

// ─── Public result types ─────────────────────────────────────────────
export interface DbError {
  message: string;
  code?: string;
  details?: string;
}

// Tables absent from database.types.ts get loosely-typed rows.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRow = Record<string, any>;

type Tables = Database['public']['Tables'];
type RowOf<K extends string> = K extends keyof Tables ? Tables[K]['Row'] : AnyRow;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbResult<T = any> =
  | { data: T; error: null; count: number | null }
  | { data: null; error: DbError; count: null };

const IDENT = /^[a-z_][a-z0-9_]*$/;

function quoteIdent(name: string): string {
  if (!IDENT.test(name)) throw new Error(`Invalid identifier: ${name}`);
  return `"${name}"`;
}

type Params = unknown[];
type FilterOp = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

interface Filter {
  column: string;
  op: FilterOp;
  value: unknown;
  negate?: boolean;
}

const OPERATORS: Record<Exclude<FilterOp, 'is' | 'in'>, string> = {
  eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=', like: 'LIKE', ilike: 'ILIKE',
};

function splitTopLevel(input: string, sep = ','): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of input) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === sep && depth === 0) {
      parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Parses a filter-list string such as `end_date.gte.2026-01-01,end_date.is.null`. */
function parseOrFilters(expr: string): Filter[] {
  return splitTopLevel(expr).map((part) => {
    let rest = part;
    let negate = false;
    const [column, ...tail] = rest.split('.');
    rest = tail.join('.');
    if (rest.startsWith('not.')) {
      negate = true;
      rest = rest.slice(4);
    }
    const dot = rest.indexOf('.');
    const op = rest.slice(0, dot) as FilterOp;
    const raw = rest.slice(dot + 1);
    let value: unknown = raw;
    if (op === 'is') value = raw === 'null' ? null : raw === 'true';
    if (op === 'in') value = raw.replace(/^\(|\)$/g, '').split(',').map((v) => v.trim());
    if (!(op in OPERATORS) && op !== 'is' && op !== 'in') {
      throw new Error(`Unsupported filter operator in or(): ${op}`);
    }
    return { column, op, value, negate };
  });
}

function compileFilter(f: Filter, alias: string, params: Params): string {
  const col = `${alias}.${quoteIdent(f.column)}`;
  let sql: string;
  if (f.op === 'is') {
    sql = f.value === null ? `${col} IS NULL` : `${col} IS ${f.value ? 'TRUE' : 'FALSE'}`;
  } else if (f.op === 'in') {
    params.push(f.value);
    sql = `${col} = ANY($${params.length})`;
  } else {
    params.push(f.value);
    sql = `${col} ${OPERATORS[f.op]} $${params.length}`;
  }
  return f.negate ? `NOT (${sql})` : sql;
}

type Operation = 'select' | 'insert' | 'update' | 'delete' | 'upsert';
type ResultMode = 'many' | 'single' | 'maybeSingle';

export class QueryBuilder<Row = AnyRow, Result = Row[]> implements PromiseLike<DbResult<Result>> {
  private operation: Operation = 'select';
  private selectColumns = '*';
  private returningColumns: string | null = null;
  private countOnly = false;
  private rows: Record<string, unknown>[] = [];
  private patch: Record<string, unknown> = {};
  private conflictTarget: string | undefined;
  private ignoreDuplicates = false;
  private filters: Filter[] = [];
  private orGroups: Filter[][] = [];
  private orders: { column: string; ascending: boolean; nullsFirst?: boolean }[] = [];
  private limitCount: number | undefined;
  private offsetCount: number | undefined;
  private resultMode: ResultMode = 'many';

  constructor(private readonly table: string) {}

  // ── Operations ──
  select(columns = '*', options?: { count?: 'exact'; head?: boolean }): this {
    if (this.operation === 'select') {
      this.selectColumns = columns;
      this.countOnly = Boolean(options?.head && options?.count);
    } else {
      this.returningColumns = columns;
    }
    return this;
  }

  insert(values: object | object[]): this {
    this.operation = 'insert';
    this.rows = (Array.isArray(values) ? values : [values]) as Record<string, unknown>[];
    return this;
  }

  upsert(
    values: object | object[],
    options?: { onConflict?: string; ignoreDuplicates?: boolean }
  ): this {
    this.operation = 'upsert';
    this.rows = (Array.isArray(values) ? values : [values]) as Record<string, unknown>[];
    this.conflictTarget = options?.onConflict;
    this.ignoreDuplicates = Boolean(options?.ignoreDuplicates);
    return this;
  }

  update(values: object): this {
    this.operation = 'update';
    this.patch = values as Record<string, unknown>;
    return this;
  }

  delete(): this {
    this.operation = 'delete';
    return this;
  }

  // ── Filters ──
  private addFilter(column: string, op: FilterOp, value: unknown, negate = false): this {
    this.filters.push({ column, op, value, negate });
    return this;
  }
  eq(column: string, value: unknown) { return this.addFilter(column, 'eq', value); }
  neq(column: string, value: unknown) { return this.addFilter(column, 'neq', value); }
  gt(column: string, value: unknown) { return this.addFilter(column, 'gt', value); }
  gte(column: string, value: unknown) { return this.addFilter(column, 'gte', value); }
  lt(column: string, value: unknown) { return this.addFilter(column, 'lt', value); }
  lte(column: string, value: unknown) { return this.addFilter(column, 'lte', value); }
  like(column: string, value: string) { return this.addFilter(column, 'like', value); }
  ilike(column: string, value: string) { return this.addFilter(column, 'ilike', value); }
  is(column: string, value: null | boolean) { return this.addFilter(column, 'is', value); }
  in(column: string, values: readonly unknown[]) { return this.addFilter(column, 'in', [...values]); }
  not(column: string, op: FilterOp, value: unknown) { return this.addFilter(column, op, value, true); }
  or(expression: string): this {
    this.orGroups.push(parseOrFilters(expression));
    return this;
  }

  // ── Modifiers ──
  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }): this {
    this.orders.push({ column, ascending: options?.ascending ?? true, nullsFirst: options?.nullsFirst });
    return this;
  }
  limit(count: number): this {
    this.limitCount = count;
    return this;
  }
  range(from: number, to: number): this {
    this.offsetCount = from;
    this.limitCount = to - from + 1;
    return this;
  }
  single(): QueryBuilder<Row, Row> {
    this.resultMode = 'single';
    return this as unknown as QueryBuilder<Row, Row>;
  }
  maybeSingle(): QueryBuilder<Row, Row | null> {
    this.resultMode = 'maybeSingle';
    return this as unknown as QueryBuilder<Row, Row | null>;
  }

  // ── Execution ──
  then<TResult1 = DbResult<Result>, TResult2 = never>(
    onfulfilled?: ((value: DbResult<Result>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return (this.execute() as Promise<DbResult<Result>>).then(onfulfilled, onrejected);
  }

  private async execute(): Promise<DbResult> {
    try {
      const schema = await getSchema();
      const tableColumns = schema.columns.get(this.table);
      if (!tableColumns) throw Object.assign(new Error(`Unknown table: ${this.table}`), { code: '42P01' });

      const { sql, params } = this.compile(schema, tableColumns);
      const result = await pool.query(sql, params);

      if (this.countOnly) {
        return { data: null, error: null, count: Number(result.rows[0]?.count ?? 0) };
      }

      const isMutation = this.operation !== 'select';
      const rows = result.rows;
      if (isMutation && this.returningColumns === null) {
        return { data: null, error: null, count: null };
      }
      return this.shape(rows);
    } catch (err) {
      const e = err as Error & { code?: string; detail?: string };
      return { data: null, error: { message: e.message, code: e.code, details: e.detail }, count: null };
    }
  }

  private shape(rows: Record<string, unknown>[]): DbResult {
    if (this.resultMode === 'many') return { data: rows, error: null, count: null };
    if (rows.length > 1 || (this.resultMode === 'single' && rows.length === 0)) {
      return {
        data: null,
        error: {
          code: 'PGRST116',
          message: `JSON object requested, ${rows.length === 0 ? 'no' : 'multiple'} rows returned`,
        },
        count: null,
      };
    }
    return { data: rows[0] ?? null, error: null, count: null };
  }

  private compile(schema: SchemaInfo, tableColumns: Map<string, string>): { sql: string; params: Params } {
    const params: Params = [];
    const table = quoteIdent(this.table);
    const alias = 't';

    const assertColumn = (name: string) => {
      if (!tableColumns.has(name)) {
        throw Object.assign(new Error(`Column ${this.table}.${name} does not exist`), { code: '42703' });
      }
    };

    const encode = (column: string, value: unknown) => {
      const type = tableColumns.get(column);
      if ((type === 'json' || type === 'jsonb') && value !== null) return JSON.stringify(value);
      return value;
    };

    const where = () => {
      const clauses = this.filters.map((f) => {
        assertColumn(f.column);
        return compileFilter(f, alias, params);
      });
      for (const group of this.orGroups) {
        group.forEach((f) => assertColumn(f.column));
        clauses.push(`(${group.map((f) => compileFilter(f, alias, params)).join(' OR ')})`);
      }
      return clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
    };

    const returning = () =>
      this.returningColumns === null
        ? ''
        : ` RETURNING ${this.projection(this.returningColumns, schema, tableColumns, alias)}`;

    switch (this.operation) {
      case 'select': {
        if (this.countOnly) {
          return { sql: `SELECT count(*)::int AS count FROM ${table} ${alias}${where()}`, params };
        }
        let sql = `SELECT ${this.projection(this.selectColumns, schema, tableColumns, alias)} FROM ${table} ${alias}${where()}`;
        if (this.orders.length) {
          sql += ' ORDER BY ' + this.orders.map((o) => {
            assertColumn(o.column);
            const nulls = o.nullsFirst === undefined ? '' : o.nullsFirst ? ' NULLS FIRST' : ' NULLS LAST';
            return `${alias}.${quoteIdent(o.column)} ${o.ascending ? 'ASC' : 'DESC'}${nulls}`;
          }).join(', ');
        }
        if (this.limitCount !== undefined) {
          params.push(this.limitCount);
          sql += ` LIMIT $${params.length}`;
        }
        if (this.offsetCount !== undefined) {
          params.push(this.offsetCount);
          sql += ` OFFSET $${params.length}`;
        }
        return { sql, params };
      }

      case 'insert':
      case 'upsert': {
        if (this.rows.length === 0) throw new Error('No rows to insert');
        const columns = Array.from(
          new Set(this.rows.flatMap((r) => Object.keys(r).filter((k) => r[k] !== undefined)))
        );
        columns.forEach(assertColumn);
        const values = this.rows.map((row) =>
          '(' + columns.map((c) => {
            if (row[c] === undefined) return 'DEFAULT';
            params.push(encode(c, row[c]));
            return `$${params.length}`;
          }).join(', ') + ')'
        );
        let sql = `INSERT INTO ${table} AS ${alias} (${columns.map(quoteIdent).join(', ')}) VALUES ${values.join(', ')}`;
        if (this.operation === 'upsert') {
          const target = this.conflictTarget
            ? this.conflictTarget.split(',').map((c) => c.trim())
            : schema.primaryKeys.get(this.table) ?? [];
          target.forEach(assertColumn);
          const updatable = columns.filter((c) => !target.includes(c));
          sql += ` ON CONFLICT (${target.map(quoteIdent).join(', ')})`;
          sql += this.ignoreDuplicates || updatable.length === 0
            ? ' DO NOTHING'
            : ` DO UPDATE SET ${updatable.map((c) => `${quoteIdent(c)} = EXCLUDED.${quoteIdent(c)}`).join(', ')}`;
        }
        return { sql: sql + returning(), params };
      }

      case 'update': {
        const entries = Object.entries(this.patch).filter(([, v]) => v !== undefined);
        if (entries.length === 0) throw new Error('No fields to update');
        const sets = entries.map(([c, v]) => {
          assertColumn(c);
          params.push(encode(c, v));
          return `${quoteIdent(c)} = $${params.length}`;
        });
        return { sql: `UPDATE ${table} AS ${alias} SET ${sets.join(', ')}${where()}${returning()}`, params };
      }

      case 'delete':
        return { sql: `DELETE FROM ${table} AS ${alias}${where()}${returning()}`, params };
    }
  }

  /**
   * Compiles a column list such as `*`, `id, title` or `*, learning_providers(name)`.
   * `relation(cols)` embeds a related row through a foreign key: as an object
   * when this table references it, or as an array when it references this table.
   */
  private projection(
    columns: string,
    schema: SchemaInfo,
    tableColumns: Map<string, string>,
    alias: string
  ): string {
    return splitTopLevel(columns || '*').map((item) => {
      if (item === '*') return `${alias}.*`;

      const embed = item.match(/^(?:([a-z_][a-z0-9_]*):)?([a-z_][a-z0-9_]*)\((.*)\)$/);
      if (embed) {
        const [, as, relation, inner] = embed;
        const relColumns = schema.columns.get(relation);
        if (!relColumns) throw new Error(`Unknown relation: ${relation}`);
        const innerCols = inner.trim() === '*' || !inner.trim()
          ? 'r.*'
          : splitTopLevel(inner).map((c) => {
              if (!relColumns.has(c)) throw new Error(`Column ${relation}.${c} does not exist`);
              return `r.${quoteIdent(c)}`;
            }).join(', ');
        const outName = quoteIdent(as ?? relation);

        const toOne = schema.foreignKeys.find((fk) => fk.table === this.table && fk.refTable === relation);
        if (toOne) {
          return `(SELECT to_jsonb(x) FROM (SELECT ${innerCols} FROM ${quoteIdent(relation)} r
                   WHERE r.${quoteIdent(toOne.refColumn)} = ${alias}.${quoteIdent(toOne.column)}) x) AS ${outName}`;
        }
        const toMany = schema.foreignKeys.find((fk) => fk.table === relation && fk.refTable === this.table);
        if (toMany) {
          return `(SELECT coalesce(jsonb_agg(to_jsonb(x)), '[]'::jsonb) FROM (SELECT ${innerCols} FROM ${quoteIdent(relation)} r
                   WHERE r.${quoteIdent(toMany.column)} = ${alias}.${quoteIdent(toMany.refColumn)}) x) AS ${outName}`;
        }
        throw new Error(`No relationship between ${this.table} and ${relation}`);
      }

      const [name, as] = item.includes(':') ? item.split(':').reverse() : [item, undefined];
      if (!tableColumns.has(name)) {
        throw Object.assign(new Error(`Column ${this.table}.${name} does not exist`), { code: '42703' });
      }
      return as ? `${alias}.${quoteIdent(name)} AS ${quoteIdent(as)}` : `${alias}.${quoteIdent(name)}`;
    }).join(', ');
  }
}

/** Calls a Postgres function with named arguments; resolves to its return value. */
async function rpc(fn: string, args: Record<string, unknown> = {}): Promise<DbResult> {
  try {
    const params: Params = [];
    const named = Object.entries(args)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => {
        params.push(v !== null && typeof v === 'object' && !(v instanceof Date) ? JSON.stringify(v) : v);
        return `${quoteIdent(k)} => $${params.length}`;
      });
    const result = await pool.query(`SELECT ${quoteIdent(fn)}(${named.join(', ')}) AS result`, params);
    return { data: result.rows[0]?.result ?? null, error: null, count: null };
  } catch (err) {
    const e = err as Error & { code?: string; detail?: string };
    return { data: null, error: { message: e.message, code: e.code, details: e.detail }, count: null };
  }
}

function from<K extends keyof Tables>(table: K): QueryBuilder<RowOf<K>>;
function from(table: string): QueryBuilder<AnyRow>;
function from(table: string) {
  return new QueryBuilder(table);
}

export const db = { from, rpc };
