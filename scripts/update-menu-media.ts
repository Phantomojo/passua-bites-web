import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { menuItems } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL || "";

async function updateMenuItems() {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  const updates = [
    {
      name: "Passua Smocha",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/passua-smocha.jpg",
      videoUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/passua-smocha.mp4",
    },
    {
      name: "Zigizaga",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/zigizaga.jpg",
      videoUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/zigizaga.mp4",
    },
    {
      name: "Burger",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/burger.jpg",
      videoUrl: "",
    },
    {
      name: "Masala Chips",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/masala-chips.jpg",
      videoUrl: "",
    },
    {
      name: "Hot Blazer",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/hot-blazer.jpg",
      videoUrl: "",
    },
    {
      name: "Sultan",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/sultan.jpg",
      videoUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/sultan.mp4",
    },
    {
      name: "Pasua Corn",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/pasua-corn.jpg",
      videoUrl: "",
    },
    {
      name: "Mega Sultan",
      imageUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/sultan.jpg",
      videoUrl:
        "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/mega-sultan.mp4",
    },
  ];

  for (const item of updates) {
    await db
      .update(menuItems)
      .set({ imageUrl: item.imageUrl, videoUrl: item.videoUrl })
      .where(eq(menuItems.name, item.name));
    console.log(`Updated: ${item.name}`);
  }

  console.log("Done!");
}

updateMenuItems();
