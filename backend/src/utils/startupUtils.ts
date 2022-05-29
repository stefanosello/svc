import cors from 'cors';

export interface ProcessOutput {
  stdout: string,
  stderr: string,
  exitCode: number
};

export interface CompilationResult {
  procOutput: ProcessOutput,
  waitingTime?: number,
  inPath: string,
  outPath: string
}

const MANDATORY_CONFIG_KEYS = [
  "BACKEND_BASE_DIR",
  "COMPILER_API_ROOT",
  "BACKEND_ALLOWED_HOSTS",
  "BACKEND_HTTP_PORT"
];

// taken from https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cors/index.d.ts
const allowedOrigins: string[] = (process.env.BACKEND_ALLOWED_HOSTS || "").split(",");

export const corsOpts: cors.CorsOptions = {
  origin: (requestOrigin: string | undefined, callback: (err: Error | null, origin?: boolean | string | RegExp | (boolean | string | RegExp)[]) => void) => {
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    if (!requestOrigin || allowedOrigins.indexOf(requestOrigin) > -1) {
      callback(null, true);
    } else {
      console.log(`[CORS] Received req by origin: ${requestOrigin}, allowed origins: ${allowedOrigins}`);
      callback(new Error('Not Allowed by CORS'));
    }
  }
};

export const corsConfig = cors(corsOpts);

export const checkEnv = () => {
  MANDATORY_CONFIG_KEYS.forEach(key => {
    if (!process.env[key]) throw new Error(`Missing config key: ${key}`);
  });
}
