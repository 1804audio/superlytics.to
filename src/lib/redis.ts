import { UmamiRedisClient } from '@umami/redis-client';

const enabled = !!process.env.REDIS_URL;
const REDIS_GLOBAL_KEY = 'UMAMI_REDIS_CLIENT';

function getClient() {
  const redis = new UmamiRedisClient(process.env.REDIS_URL);

  if (process.env.NODE_ENV !== 'production') {
    global[REDIS_GLOBAL_KEY] = redis;
  }

  return redis;
}

const client = global[REDIS_GLOBAL_KEY] || getClient();

export default { client, enabled };
