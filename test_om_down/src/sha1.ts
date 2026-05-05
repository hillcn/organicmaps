import * as crypto from 'crypto';
import * as fs from 'fs';

export class SHA1 {
  static calculate(filePath: string): string {
    const hash = crypto.createHash('sha1');
    const fileBuffer = fs.readFileSync(filePath);
    hash.update(fileBuffer);
    return hash.digest('base64');
  }

  static async calculateAsync(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha1');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('base64')));
      stream.on('error', (err) => reject(err));
    });
  }
}
