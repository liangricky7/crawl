import Fastify from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { MODES, Mode, fetchIsochrone } from './isochrone';

for (const k of ['TRAVELTIME_APP_ID', 'TRAVELTIME_API_KEY']) {
  if (!process.env[k]) {
    console.error(`Missing ${k}. Put it in the repo-root .env.`);
    process.exit(1);
  }
}

const app = Fastify({ logger: true });
// ponytail: per-IP, in-memory; move to per-user (auth) + shared store once accounts land in P2
app.register(rateLimit, { max: 30, timeWindow: '1 minute' });

// routes live in a plugin so they register after rate-limit has loaded and get wrapped by it
app.register(async api => { api.post<{ Body: { lat: number; lng: number; minutes: number; modes: Mode[] } }>('/isochrone', {
  schema: {
    body: {
      type: 'object',
      required: ['lat', 'lng', 'minutes', 'modes'],
      additionalProperties: false,
      properties: {
        lat: { type: 'number', minimum: -90, maximum: 90 },
        lng: { type: 'number', minimum: -180, maximum: 180 },
        minutes: { type: 'integer', minimum: 1, maximum: 120 },
        modes: { type: 'array', minItems: 1, maxItems: 4, items: { enum: [...MODES] } },
      },
    },
  },
}, async (req, reply) => {
  const { lat, lng, minutes, modes } = req.body;
  try {
    return { shapes: await fetchIsochrone({ lat, lng }, minutes, modes) };
  } catch (err) {
    req.log.error(err);
    return reply.code(502).send({ error: 'isochrone_failed' });
  }
}); });

// 0.0.0.0 so a phone on the same Wi-Fi can reach it
app.listen({ host: '0.0.0.0', port: Number(process.env.PORT ?? 3000) });
