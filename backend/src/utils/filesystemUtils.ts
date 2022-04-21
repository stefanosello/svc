import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const baseDir = process.env.BACKEND_BASE_DIR || "";

export const createFile = (code: string): string[] => {
  const inFilename = `${randomUUID()}.cpp`;
  const inPath = path.join(baseDir, inFilename);
  fs.writeFileSync(inPath, code);
  //console.log(`[FS] Created file: ${inPath}`);
  return [inPath, inFilename];
} 

export const removeFile = (filename: string): void => {
  const filepath: string = path.join(baseDir, filename);
  if (filepath) {

    if (fs.existsSync(filepath)) {
      fs.unlink(filepath, (err) => { 
        if (err) {
          console.error(`[FS] ERROR: Remove file ${filepath} failed: ${err}`);
        } else {
        //  console.error(`[FS] Removed file: ${inPath}`);
        }
      });

    }
  }
} 