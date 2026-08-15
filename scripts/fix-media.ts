import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { menuItems } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL || "";

async function updateMenuItems() {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  // Items WITH images (no video): Show image only
  // Items WITH videos: Show video (no fallback image needed)

  // Clear imageUrl for items that have videos - video shows with poster
  // The video's poster attribute will handle the preview

  // Update: Set imageUrl to NULL for video items (video will show, no fallback image)
  await db
    .update(menuItems)
    .set({ imageUrl: null })
    .where(eq(menuItems.name, "Passua Smocha"));
  await db
    .update(menuItems)
    .set({ imageUrl: null })
    .where(eq(menuItems.name, "Zigizaga"));
  await db
    .update(menuItems)
    .set({ imageUrl: null })
    .where(eq(menuItems.name, "Sultan"));
  await db
    .update(menuItems)
    .set({ imageUrl: null })
    .where(eq(menuItems.name, "Mega Sultan"));

  console.log("Updated - video items now have NULL imageUrl");

  console.log("\nFinal state:");
  const items = await db.select().from(menuItems).execute();
  for (const item of items) {
    const img = item.imageUrl || "none (video-only)";
    const vid = item.videoUrl?.split("/").pop() || "none";
    console.log(`${item.name}: img=${img}, video=${vid}`);
  }
}

updateMenuItems();
