/**
 * An in-memory stand-in for the Supabase admin client, with just enough
 * behaviour to prove the webhook's two hard guarantees.
 *
 * The important part is the UNIQUE constraint on `stripe_events.id`: it returns
 * Postgres error 23505 exactly as PostgREST would, because that code is the
 * hinge the whole idempotency argument turns on. A fake that accepted duplicate
 * inserts would make the test pass while the production route double-granted.
 */

export interface RpcCall { name: string; args: Record<string, unknown> }

type Row = Record<string, unknown>;

interface Result<T> { data: T; error: { code: string; message: string } | null }

export class FakeAdmin {
  tables = new Map<string, Row[]>();
  rpcCalls: RpcCall[] = [];
  /** Set to a code to make the next stripe_events insert fail with it. */
  failEventInsertWith: string | null = null;

  seed(table: string, rows: Row[]) {
    this.tables.set(table, rows.map((r) => ({ ...r })));
  }

  rows(table: string): Row[] {
    let existing = this.tables.get(table);
    if (!existing) {
      existing = [];
      this.tables.set(table, existing);
    }
    return existing;
  }

  callsTo(name: string): RpcCall[] {
    return this.rpcCalls.filter((c) => c.name === name);
  }

  async rpc(name: string, args: Record<string, unknown>): Promise<Result<null>> {
    this.rpcCalls.push({ name, args });
    return { data: null, error: null };
  }

  from(table: string) {
    const rows = this.rows(table);
    const self = this;

    return {
      async insert(values: Row): Promise<Result<null>> {
        if (table === 'stripe_events') {
          if (self.failEventInsertWith) {
            const code = self.failEventInsertWith;
            return { data: null, error: { code, message: 'injected' } };
          }
          if (rows.some((r) => r.id === values.id)) {
            // What PostgREST returns for a primary-key collision.
            return {
              data: null,
              error: { code: '23505', message: 'duplicate key value violates unique constraint' },
            };
          }
        }
        rows.push({ ...values });
        return { data: null, error: null };
      },

      select(_cols?: string) {
        const filters: Array<[string, unknown]> = [];
        const builder = {
          eq(col: string, val: unknown) {
            filters.push([col, val]);
            return builder;
          },
          async single(): Promise<Result<Row | null>> {
            const found = rows.find((r) => filters.every(([c, v]) => r[c] === v));
            return found
              ? { data: found, error: null }
              : { data: null, error: { code: 'PGRST116', message: 'no rows' } };
          },
        };
        return builder;
      },

      update(patch: Row) {
        const builder = {
          async eq(col: string, val: unknown): Promise<Result<null>> {
            for (const r of rows) if (r[col] === val) Object.assign(r, patch);
            return { data: null, error: null };
          },
        };
        return builder;
      },
    };
  }
}
