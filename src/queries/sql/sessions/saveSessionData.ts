import { DATA_TYPE } from '@/lib/constants';
import { uuid } from '@/lib/crypto';
import { flattenJSON, getStringValue } from '@/lib/data';
import prisma from '@/lib/prisma';
import { DynamicData } from '@/lib/types';
import { CLICKHOUSE, PRISMA, runQuery } from '@/lib/db';
import kafka from '@/lib/kafka';
import clickhouse from '@/lib/clickhouse';

export interface SaveSessionDataArgs {
  websiteId: string;
  sessionId: string;
  sessionData: DynamicData;
  distinctId?: string;
  createdAt?: Date;
}

export async function saveSessionData(data: SaveSessionDataArgs) {
  return runQuery({
    [PRISMA]: () => relationalQuery(data),
    [CLICKHOUSE]: () => clickhouseQuery(data),
  });
}

export async function relationalQuery({
  websiteId,
  sessionId,
  sessionData,
  distinctId,
  createdAt,
}: SaveSessionDataArgs) {
  const { transaction } = prisma;

  const jsonKeys = flattenJSON(sessionData);

  const flattenedData = jsonKeys.map(a => ({
    id: uuid(),
    websiteId,
    sessionId,
    dataKey: a.key,
    stringValue: getStringValue(a.value, a.dataType),
    numberValue: a.dataType === DATA_TYPE.number ? a.value : null,
    dateValue: a.dataType === DATA_TYPE.date ? new Date(a.value) : null,
    dataType: a.dataType,
    distinctId,
    createdAt,
  }));

  // Use transaction to prevent race conditions
  await transaction(async tx => {
    // First, get existing records within the transaction
    const existing = await tx.sessionData.findMany({
      where: {
        sessionId,
      },
      select: {
        id: true,
        sessionId: true,
        dataKey: true,
      },
    });

    // Process all upserts within the same transaction
    const operations = [];

    for (const data of flattenedData) {
      const { sessionId, dataKey, ...props } = data;
      const record = existing.find(e => e.sessionId === sessionId && e.dataKey === dataKey);

      if (record) {
        operations.push(
          tx.sessionData.update({
            where: {
              id: record.id,
            },
            data: {
              ...props,
            },
          }),
        );
      } else {
        operations.push(
          tx.sessionData.create({
            data,
          }),
        );
      }
    }

    // Execute all operations within the transaction
    await Promise.all(operations);
  });
}

async function clickhouseQuery({
  websiteId,
  sessionId,
  sessionData,
  distinctId,
  createdAt,
}: SaveSessionDataArgs) {
  const { insert, getUTCString } = clickhouse;
  const { sendMessage } = kafka;

  const jsonKeys = flattenJSON(sessionData);

  const messages = jsonKeys.map(({ key, value, dataType }) => {
    return {
      website_id: websiteId,
      session_id: sessionId,
      data_key: key,
      data_type: dataType,
      string_value: getStringValue(value, dataType),
      number_value: dataType === DATA_TYPE.number ? value : null,
      date_value: dataType === DATA_TYPE.date ? getUTCString(value) : null,
      distinct_id: distinctId,
      created_at: getUTCString(createdAt),
    };
  });

  if (kafka.enabled) {
    await sendMessage('session_data', messages);
  } else {
    await insert('session_data', messages);
  }
}
