import "dotenv/config";
import { put } from "@vercel/blob";
import { readFile } from "fs/promises";

const BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || "";

const mediaFiles = [
  // Images - exact mapping from available files
  { name: "burger.jpg", path: "/home/ph/Pictures/pasua menu/Burger.jpeg" },
  {
    name: "masala-chips.jpg",
    path: "/home/ph/Pictures/pasua menu/Masala chips.jpeg",
  },
  {
    name: "hot-blazer.jpg",
    path: "/home/ph/Pictures/pasua menu/Hotblazer1.jpeg",
  },
  {
    name: "sultan-fallback.jpg",
    path: "/home/ph/Pictures/pasua menu/hotblazer2.jpeg",
  },
  {
    name: "pasua-corn.jpg",
    path: "/home/ph/Pictures/pasua menu/pasua corn.jpeg",
  },

  // Videos - exact mapping from available videos
  {
    name: "passua-smocha.mp4",
    path: "/home/ph/Pictures/pasua menu/Pasuasmocha.mp4",
  },
  { name: "zigizaga.mp4", path: "/home/ph/Pictures/pasua menu/zigizaga.mp4" },
  { name: "sultan.mp4", path: "/home/ph/Pictures/pasua menu/Sultan.mp4" },
  {
    name: "mega-sultan.mp4",
    path: "/home/ph/Pictures/pasua menu/megasultan.mp4",
  },
];

async function uploadMedia() {
  if (!BLOB_READ_WRITE_TOKEN) {
    console.error("Error: BLOB_READ_WRITE_TOKEN not set");
    process.exit(1);
  }

  console.log(`Uploading ${mediaFiles.length} files to Vercel Blob...\n`);

  for (const file of mediaFiles) {
    try {
      console.log(`Uploading ${file.name}...`);
      const content = await readFile(file.path);
      const blob = await put(file.name, content, {
        access: "public",
        blobAccessToken: BLOB_READ_WRITE_TOKEN,
      });
      console.log(`  → ${blob.url}`);
    } catch (error) {
      console.error(`Failed: ${file.name}`, error);
    }
  }

  console.log("\n=== CORRECT Database Update ===\n");
  console.log(`UPDATE menuItems SET imageUrl = CASE`);
  console.log(
    `  WHEN name = 'Burger' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/burger.jpg'`
  );
  console.log(
    `  WHEN name = 'Masala Chips' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/masala-chips.jpg'`
  );
  console.log(
    `  WHEN name = 'Hot Blazer' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/hot-blazer.jpg'`
  );
  console.log(
    `  WHEN name = 'Sultan' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/sultan-fallback.jpg'`
  );
  console.log(
    `  WHEN name = 'Pasua Corn' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/pasua-corn.jpg'`
  );
  console.log(
    `  WHEN name = 'Mega Sultan' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/sultan-fallback.jpg'`
  );
  console.log(
    `  WHEN name = 'Passua Smocha' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/burger.jpg'`
  );
  console.log(
    `  WHEN name = 'Zigizaga' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/masala-chips.jpg'`
  );
  console.log(
    `END WHERE name IN ('Burger', 'Masala Chips', 'Hot Blazer', 'Sultan', 'Pasua Corn', 'Mega Sultan', 'Passua Smocha', 'Zigizaga');`
  );

  console.log(`\nUPDATE menuItems SET videoUrl = CASE`);
  console.log(
    `  WHEN name = 'Passua Smocha' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/passua-smocha.mp4'`
  );
  console.log(
    `  WHEN name = 'Zigizaga' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/zigizaga.mp4'`
  );
  console.log(
    `  WHEN name = 'Sultan' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/sultan.mp4'`
  );
  console.log(
    `  WHEN name = 'Mega Sultan' THEN 'https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/mega-sultan.mp4'`
  );
  console.log(
    `END WHERE name IN ('Passua Smocha', 'Zigizaga', 'Sultan', 'Mega Sultan');`
  );
}

uploadMedia();
