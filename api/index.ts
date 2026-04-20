// @ts-nocheck
export default function handler(req: any, res: any) {
  const url = req.url || "";
  const origin = req.headers.origin || "";
  const isProduction = origin.includes("vercel.app");

  // Set CORS headers - restrict in production
  res.setHeader("Access-Control-Allow-Origin", isProduction ? origin : "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  // Menu list - exact match
  if (url === "/api/trpc/menu.list" || url === "/api/trpc/menu.list?input={}") {
    return res.status(200).json({
      result: {
        data: {
          json: [
            {
              id: 1,
              name: "Burger",
              price: "150.00",
              imageUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/burger.jpg",
              description:
                "Buns, lettuce, sliced kachumbari, sauces, beef pattie",
              category: "Burgers",
              available: 1,
              videoUrl: null,
            },
            {
              id: 2,
              name: "Masala Chips",
              price: "150.00",
              imageUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/masala-chips.jpg",
              description:
                "Crunchy outside, soft inside fries, well marinated — spicy or non-spicy",
              category: "Sides",
              available: 1,
              videoUrl: null,
            },
            {
              id: 3,
              name: "Hot Blazer",
              price: "190.00",
              imageUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/hot-blazer.jpg",
              description:
                "Two chapatis (wrapped), lettuce, kachumbari, boerewors, indomie, avocado, gravy sauce",
              category: "Specials",
              available: 1,
              videoUrl: null,
            },
            {
              id: 4,
              name: "Pasua Corn",
              price: "280.00",
              imageUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/pasua-corn.jpg",
              description:
                "One beef burger + masala chips (spicy or non-spicy)",
              category: "Sides",
              available: 1,
              videoUrl: null,
            },
            {
              id: 5,
              name: "Passua Smocha",
              price: "95.00",
              imageUrl: null,
              description:
                "Chapati, beef smokie, kachumbari, indomie, avocado, seasoned with sauces",
              category: "Smoshas",
              available: 1,
              videoUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/passua-smocha.mp4",
            },
            {
              id: 6,
              name: "Zigizaga",
              price: "125.00",
              imageUrl: null,
              description:
                "Chapati, beef smokie, kachumbari, indomie, avocado, topped with a boiled egg, seasoned with sauces",
              category: "Smoshas",
              available: 1,
              videoUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/zigizaga.mp4",
            },
            {
              id: 7,
              name: "Sultan",
              price: "250.00",
              imageUrl: null,
              description:
                "Two chapatis (wrapped), lettuce, kachumbari, one beef pattie, masala chips, avocado, sauces — comes with a soda",
              category: "Combos",
              available: 1,
              videoUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/sultan.mp4",
            },
            {
              id: 8,
              name: "Mega Sultan",
              price: "560.00",
              imageUrl: null,
              description:
                "Two chapatis (wrapped), lettuce, kachumbari, two beef patties, cheese, masala chips, avocado, sauces — comes with a soda",
              category: "Combos",
              available: 1,
              videoUrl:
                "https://ptewdrb0fmlmvmtc.public.blob.vercel-storage.com/mega-sultan.mp4",
            },
          ],
        },
      },
    });
  }

  // Location get
  if (
    url === "/api/trpc/location.get" ||
    url === "/api/trpc/location.get?input={}"
  ) {
    return res.status(200).json({
      result: {
        data: {
          json: { key: "displacementMessage", value: "Find us in Ruiru!" },
        },
      },
    });
  }

  // Location getAll
  if (
    url === "/api/trpc/location.getAll" ||
    url === "/api/trpc/location.getAll?input={}"
  ) {
    return res.status(200).json({
      result: {
        data: {
          json: [
            { key: "displacementMessage", value: "Find us in Ruiru!" },
            { key: "phone", value: "+254700000000" },
            { key: "location", value: "Ruiru, Kenya" },
          ],
        },
      },
    });
  }

  // Health check
  if (url === "/health" || url === "/api/health") {
    return res.status(200).json({ status: "ok" });
  }

  // Default fallback - return empty array
  return res.status(200).json({ result: { data: { json: [] } } });
}
