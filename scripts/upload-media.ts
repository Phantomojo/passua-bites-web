import { readFile } from "fs/promises";
import { join } from "path";
import { put } from "@vercel/blob";

const BLOB_STORE_NAME = "passua-media";

const mediaFiles = [
  {
    name: "passua-smocha.jpg",
    path: "/home/ph/Pictures/pasua menu/Burger.jpeg",
  },
  {
    name: "zigizaga.jpg",
    path: "/home/ph/Pictures/pasua menu/Masala chips.jpeg",
  },
  { name: "burger.jpg", path: "/home/ph/Pictures/pasua menu/Burger.jpeg" },
  {
    name: "masala-chips.jpg",
    path: "/home/ph/Pictures/pasua menu/Masala chips.jpeg",
  },
  {
    name: "hot-blazer.jpg",
    path: "/home/ph/Pictures/pasua menu/Hotblazer1.jpeg",
  },
  { name: "sultan.jpg", path: "/home/ph/Pictures/pasua menu/pasua corn.jpeg" },
  {
    name: "pasua-corn.jpg",
    path: "/home/ph/Pictures/pasua menu/pasua corn.jpeg",
  },
  {
    name: "mega-sultan.mp4",
    path: "/home/ph/Pictures/pasua menu/megasultan.mp4",
  },
  {
    name: "passua-smocha.mp4",
    path: "/home/ph/Pictures/pasua menu/Pasuasmocha.mp4",
  },
  { name: "sultan.mp4", path: "/home/ph/Pictures/pasua menu/Sultan.mp4" },
  { name: "zigizaga.mp4", path: "/home/ph/Pictures/pasua menu/zigizaga.mp4" },
];

async function uploadMedia() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("Error: BLOB_READ_WRITE_TOKEN not set in environment");
    console.log("\nTo set up Vercel Blob:");
    console.log("1. Go to Vercel Dashboard → Storage → Create Blob Store");
    console.log(
      "2. Name it 'passua-media' (or update BLOB_STORE_NAME in this script)"
    );
    console.log(
      "3. Create a token: Vercel Dashboard → Settings → Tokens → Create Token"
    );
    console.log("4. Set BLOB_READ_WRITE_TOKEN environment variable");
    process.exit(1);
  }

  console.log(`Uploading ${mediaFiles.length} files to Vercel Blob...`);

  const results: { name: string; url: string }[] = [];

  for (const file of mediaFiles) {
    try {
      console.log(`Uploading ${file.name}...`);
      const content = await readFile(file.path);
      const blob = await put(file.name, content, {
        access: "public",
        blobAccessToken: process.env.BLOB_READ_WRITE_TOKEN,
      });
      console.log(`  → ${blob.url}`);
      results.push({ name: file.name, url: blob.url });
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error);
    }
  }

  console.log("\n=== Upload Results ===");
  console.log("Copy these URLs to your database:\n");

  const menuItems = [
    {
      name: "Passua Smocha",
      image: results.find(r => r.name === "passua-smocha.jpg")?.url || "",
      video: results.find(r => r.name === "passua-smocha.mp4")?.url || "",
    },
    {
      name: "Zigizaga",
      image: results.find(r => r.name === "zigizaga.jpg")?.url || "",
      video: results.find(r => r.name === "zigizaga.mp4")?.url || "",
    },
    {
      name: "Burger",
      image: results.find(r => r.name === "burger.jpg")?.url || "",
      video: "",
    },
    {
      name: "Masala Chips",
      image: results.find(r => r.name === "masala-chips.jpg")?.url || "",
      video: "",
    },
    {
      name: "Hot Blazer",
      image: results.find(r => r.name === "hot-blazer.jpg")?.url || "",
      video: "",
    },
    {
      name: "Sultan",
      image: results.find(r => r.name === "sultan.jpg")?.url || "",
      video: results.find(r => r.name === "sultan.mp4")?.url || "",
    },
    {
      name: "Pasua Corn",
      image: results.find(r => r.name === "pasua-corn.jpg")?.url || "",
      video: "",
    },
    {
      name: "Mega Sultan",
      image: results.find(r => r.name === "sultan.jpg")?.url || "",
      video: results.find(r => r.name === "mega-sultan.mp4")?.url || "",
    },
  ];

  console.log("UPDATE menuItems SET imageUrl = CASE");
  for (const item of menuItems) {
    console.log(`  WHEN name = '${item.name}' THEN '${item.image}'`);
  }
  console.log("END, videoUrl = CASE");
  for (const item of menuItems) {
    console.log(`  WHEN name = '${item.name}' THEN '${item.video}'`);
  }
  console.log("END;");
}

uploadMedia();
