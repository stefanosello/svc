import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const baseDir = process.env.BACKEND_BASE_DIR || "";

export const createFile = (code: string): string[] => {
  const inFilename = `${randomUUID()}.cpp`;
  const inPath = path.join(baseDir, inFilename);
  fs.writeFileSync(inPath, code);
  return [inPath, inFilename];
} 

export const removeFile = (filepath: string): void => {
  if (filepath) {

    if (fs.existsSync(filepath)) {
      fs.unlink(filepath, (err) => { 
        if (err) {
          console.error(`[FS] ERROR: Remove file ${filepath} failed: ${err}`);
        }
      });

    }
  }
} 