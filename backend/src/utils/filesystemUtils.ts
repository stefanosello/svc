import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const baseDir = process.env.BACKEND_BASE_DIR || "";

export const createFile = (code: string): string[] => {
  const inFilename = `${randomUUID()}.cpp`;
  const inPath = path.join(baseDir, inFilename);
  fs.writeFileSync(inPath, code);
  console.log(`[FS] Created file: ${inPath}`);
  return [inPath, inFilename];
} 