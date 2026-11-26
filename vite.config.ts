import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';

function readJsonBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

function saafSaansDevApiPlugin(): Plugin {
  return {
    name: 'saafsaans-dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = loadEnv(server.config.mode, process.cwd(), '');
      if (env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY) {
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
      }
      if (env.GEMINI_MODEL && !process.env.GEMINI_MODEL) {
        process.env.GEMINI_MODEL = env.GEMINI_MODEL;
      }

      server.middlewares.use('/api/health', (_req, res) => {
        sendJson(res, 200, {
          ok: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
        });
      });

      server.middlewares.use('/api/analyze', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          sendJson(res, 405, { error: 'Method not allowed. Use POST.' });
          return;
        }

        let body: unknown;
        try {
          body = await readJsonBody(req);
        } catch {
          sendJson(res, 400, { error: 'Invalid JSON request body.' });
          return;
        }

        try {
          const [schemaMod, openMeteoMod, aqiMod, sustainabilityMod, advisorMod] =
            await Promise.all([
              server.ssrLoadModule('/lib/advisorSchema.ts'),
              server.ssrLoadModule('/lib/openMeteo.ts'),
              server.ssrLoadModule('/lib/aqi.ts'),
              server.ssrLoadModule('/lib/sustainability.ts'),
              server.ssrLoadModule('/lib/geminiAdvisor.ts'),
            ]);

          const parsed = schemaMod.AnalyzeRequestSchema.safeParse(body);
          if (!parsed.success) {
            sendJson(res, 400, {
              error: 'Invalid request payload.',
              details: parsed.error.flatten().fieldErrors,
            });
            return;
          }

          const { cityName, lat, lon, lifestyle } = parsed.data;
          let telemetry;
          try {
            telemetry = await openMeteoMod.fetchAirQuality(lat, lon);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upstream error';
            console.error('[SaafSaans Dev API] Open-Meteo error:', msg);
            sendJson(res, 502, {
              error: 'Unable to fetch live air-quality telemetry right now. Please try again.',
            });
            return;
          }

          const airQuality = aqiMod.analyzeAirQuality(
            telemetry.current,
            telemetry.hourly,
            telemetry.currentTime,
          );
          const impact = sustainabilityMod.computeLifestyleImpact(lifestyle, airQuality);
          const { advisor, source } = await advisorMod.generateAirQualityAdvice(
            cityName,
            airQuality,
            lifestyle,
            impact,
          );

          sendJson(res, 200, {
            meta: {
              cityName,
              lat,
              lon,
              generatedAt: new Date().toISOString(),
              source,
              disclaimer:
                'Modelled Open-Meteo Estimate & CPCB AQI Formula — Informational Only, Not Medical Advice.',
            },
            airQuality,
            impactSummary: {
              totalPotentialKgCo2PerWeek: impact.totalPotentialKgCo2PerWeek,
              exposureReductionSummary: impact.exposureReductionSummary,
            },
            advisor,
          });
        } catch (err) {
          console.error('[SaafSaans Dev API] Unexpected error:', err);
          sendJson(res, 500, { error: 'Internal server error.' });
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), saafSaansDevApiPlugin()],
});
