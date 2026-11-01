import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { put } from "@vercel/blob";

export const uploadRouter = router({
  // Admin: upload an image to Vercel Blob and return its public URL
  image: adminProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        data: z.string().min(1), // base64-encoded file contents
        contentType: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const buffer = Buffer.from(input.data, "base64");
      if (buffer.length > 5 * 1024 * 1024) {
        throw new Error("Image must be smaller than 5 MB");
      }
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const blob = await put(`passua/${Date.now()}-${safeName}`, buffer, {
        access: "public",
        contentType: input.contentType || "image/jpeg",
      });
      return { url: blob.url };
    }),
});
