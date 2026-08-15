import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { menuItems } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL || "";

async function checkMenuItems() {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);

  const items = await db.select().from(menuItems).execute();

  console.log("Current Menu Items Media:");
  console.log("===========================");
  for (const item of items) {
    console.log(`\n${item.name}:`);
    console.log(`  Image: ${item.imageUrl || "(none)"}`);
    console.log(`  Video: ${item.videoUrl || "(none)"}`);
  }
}

checkMenuItems();
