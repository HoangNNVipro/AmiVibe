import { v2 as cloudinaryLib } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// .env nằm ở Backend/.env, từ Backend/config/ lên 1 level
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_SECRET_KEY = process.env.CLOUDINARY_SECRET_KEY;

let cloudinary: any = cloudinaryLib;

if (!CLOUDINARY_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_SECRET_KEY) {
  console.warn('Cloudinary env vars missing. Cloudinary uploads will fail until configured.');
  // Provide a stub so the server can start in dev; upload attempts will reject with a helpful error.
  cloudinary = {
    uploader: {
      upload: async (_data: string, _opts: any) => {
        return Promise.reject(new Error('Cloudinary not configured. Set CLOUDINARY_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_SECRET_KEY in .env'));
      }
    },
    config: () => {}
  } as any;
} else {
  cloudinary.config({
    cloud_name: CLOUDINARY_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_SECRET_KEY
  });
  console.log(`Cloudinary configured for ${CLOUDINARY_NAME}`);
}

export default cloudinary;
