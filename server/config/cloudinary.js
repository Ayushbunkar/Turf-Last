// Dynamically import cloudinary so the server doesn't crash if the package isn't installed.
// This module exports either the configured cloudinary.v2 instance or null.
import dotenv from 'dotenv';
dotenv.config();
let cloudinary = null;
try {
  const mod = await import('cloudinary').catch(() => null);
  if (mod && mod.v2) {
    cloudinary = mod.v2;
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
    }
  } else {
    console.warn('Cloudinary package not found; continuing without cloudinary support');
  }
} catch (e) {
  console.warn('Failed to initialize Cloudinary (package missing or error)', e?.message || e);
  cloudinary = null;
}

export default cloudinary;
