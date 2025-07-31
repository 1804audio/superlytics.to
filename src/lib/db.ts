export const PRISMA = 'prisma';
export const POSTGRESQL = 'postgresql';
export const CLICKHOUSE = 'clickhouse';
export const KAFKA = 'kafka';
export const KAFKA_PRODUCER = 'kafka-producer';

// Fixes issue with converting bigint values
BigInt.prototype['toJSON'] = function () {
  return Number(this);
};

export function getDatabaseType(url = process.env.DATABASE_URL) {
  const type = url && url.split(':')[0];

  if (type === 'postgres') {
    return POSTGRESQL;
  }

  return type;
}

export async function runQuery(queries: any) {
  if (process.env.CLICKHOUSE_URL) {
    if (queries[KAFKA]) {
      return queries[KAFKA]();
    }

    return queries[CLICKHOUSE]();
  }

  const db = getDatabaseType();

  if (db === POSTGRESQL) {
    return queries[PRISMA]();
  }

  throw new Error('Only PostgreSQL is supported for relational queries');
}

export function notImplemented() {
  throw new Error('Not implemented.');
}
