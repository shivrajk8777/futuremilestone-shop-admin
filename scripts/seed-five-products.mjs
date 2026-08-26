import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB = process.env.MONGODB_DB || "fjord_admin";

const client = new MongoClient(MONGODB_URI, {
  maxPoolSize: 5,
  retryReads: true,
  retryWrites: true,
});

async function seedProducts() {
  try {
    await client.connect();
    console.log(`Connected to MongoDB at ${MONGODB_URI}, database: ${MONGODB_DB}`);

    const db = client.db(MONGODB_DB);
    const collectionsCol = db.collection("collections");
    const productsCol = db.collection("products");

    // Fetch existing collections to map names/slugs
    const collections = await collectionsCol.find({}).toArray();
    console.log(`Found ${collections.length} existing collections.`);

    const collectionMap = new Map();
    for (const col of collections) {
      collectionMap.set(col.slug.toLowerCase(), col);
    }

    // Helper to get collection summary or create fallback if missing
    async function getOrCreateCollection(name, slug, description, imageUrl) {
      if (collectionMap.has(slug.toLowerCase())) {
        const existing = collectionMap.get(slug.toLowerCase());
        return {
          id: existing._id.toString(),
          name: existing.name,
          slug: existing.slug,
        };
      }

      console.log(`Creating missing collection: ${name} (${slug})`);
      const now = new Date();
      const res = await collectionsCol.insertOne({
        name,
        slug,
        description,
        imageUrl,
        order: collections.length,
        createdAt: now,
        updatedAt: now,
      });

      const newColSummary = {
        id: res.insertedId.toString(),
        name,
        slug,
      };
      collectionMap.set(slug.toLowerCase(), { _id: res.insertedId, name, slug });
      return newColSummary;
    }

    const woodCol = await getOrCreateCollection(
      "Wood",
      "wood",
      "Our Wood Collection celebrates the natural beauty of timber.",
      "https://res.cloudinary.com/dhkf4qmql/image/upload/v1780756444/fjord/products/myh0snoieql5ct14cpcv.jpg"
    );

    const diningCol = await getOrCreateCollection(
      "Dining",
      "dining",
      "Gather around with our crafted dining tables and chairs.",
      "https://res.cloudinary.com/dhkf4qmql/image/upload/v1780572947/fjord/products/gmbuppdwkzamzvkqk1uc.png"
    );

    const modernCol = await getOrCreateCollection(
      "Modern",
      "modern",
      "The Modern Collection brings together graceful lines and luxurious finishes.",
      "https://res.cloudinary.com/dhkf4qmql/image/upload/v1780572947/fjord/products/gmbuppdwkzamzvkqk1uc.png"
    );

    const darkCol = await getOrCreateCollection(
      "Dark",
      "dark",
      "Refined finishes bring an air of sophistication and drama to any room.",
      "https://res.cloudinary.com/dhkf4qmql/image/upload/v1780573101/fjord/products/vkqa7g5n4nbmf8diygbx.png"
    );

    const now = new Date();

    const sampleProducts = [
      {
        name: "Sona Armchair",
        slug: "sona-armchair",
        collectionId: woodCol.id,
        collectionName: woodCol.name,
        collectionSlug: woodCol.slug,
        imageUrl: "/images/s1Gw9pyuUEC9vViCqmou6hRgI_bc9f50.webp",
        introText: "Crafting Comfort, Inspired by the North",
        description: "Designed for ultimate comfort and aesthetic appeal, the Sona Armchair balances a robust timber framework with soft leather upholstery. Perfect for lounge spaces and modern living rooms looking for a touch of elegance.",
        order: 0,
        favorite: true,
        favoriteOrder: 0,
        materials: [
          { id: "mat-1", name: "Handcrafted solid oak frame", stock: 15 },
          { id: "mat-2", name: "Premium top-grain leather cushioning", stock: 10 },
          { id: "mat-3", name: "Ergonomic lumbar support", stock: 25 },
        ],
        dimensions: [
          { id: "dim-1", label: "Height: 82cm | Width: 74cm | Depth: 78cm | Seat Height: 44cm", price: 650 },
        ],
        galleryImages: [
          "/images/1c3s4XR0YhiP5U0jMudG8pcXqDA_692e67.webp",
          "/images/vb8XKVhsi1CNqzR5Bozhb2yTXeo_ca005a.webp",
          "/images/GbiVrsgrVhulfQoqpcQTKA1u4_a30742.webp",
        ],
        details: [
          {
            id: "det-1",
            heading: "Craftsmanship & Ergonomics",
            content: "Every curve is sanded by hand to highlight the natural oak grain while supporting long seating sessions.",
            imageUrl: "/images/1c3s4XR0YhiP5U0jMudG8pcXqDA_692e67.webp",
          },
        ],
        dimensionsInfo: {
          material: "Solid Oak & Top-Grain Leather",
          finish: "Natural Matte",
          dimensions: "82 x 74 x 78 cm",
          weight: "18 kg",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Sage Dining Chair",
        slug: "sage-dining-chair",
        collectionId: diningCol.id,
        collectionName: diningCol.name,
        collectionSlug: diningCol.slug,
        imageUrl: "/images/AI4t0V6X3l1WLYpNSHg1ozW2k_0dab0d.png",
        introText: "Natural Elegance in Every Detail",
        description: "Crafted from solid oak with a smooth, durable finish, the Sage Dining Chair is both timeless and sturdy. Its clean lines and minimalistic design complement any modern dining layout, offering reliable support and enduring style.",
        order: 1,
        favorite: true,
        favoriteOrder: 1,
        materials: [
          { id: "mat-1", name: "100% solid white oak construction", stock: 30 },
          { id: "mat-2", name: "Contoured seat for added comfort", stock: 30 },
          { id: "mat-3", name: "Non-slip floor protector pads included", stock: 50 },
        ],
        dimensions: [
          { id: "dim-1", label: "Height: 78cm | Width: 46cm | Depth: 50cm | Seat Height: 45cm", price: 380 },
        ],
        galleryImages: [
          "/images/AI4t0V6X3l1WLYpNSHg1ozW2k_392f24.png",
        ],
        details: [],
        dimensionsInfo: {
          material: "Solid White Oak",
          finish: "Protective Matte Sealer",
          dimensions: "78 x 46 x 50 cm",
          weight: "7.5 kg",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Venn Lounge Chair",
        slug: "venn-lounge-chair",
        collectionId: modernCol.id,
        collectionName: modernCol.name,
        collectionSlug: modernCol.slug,
        imageUrl: "/images/yYLWsSIThGzudn2zKw0Wb4koj8_ba7228.png",
        introText: "Simple, sleek, and built for a cozy lifestyle",
        description: "The Venn Lounge Chair brings together organic textures and modern geometry. Featuring structural wool webbing and a lightweight ash frame, it provides a relaxed seat that adds warmth and minimal charm to your interior.",
        order: 2,
        favorite: true,
        favoriteOrder: 2,
        materials: [
          { id: "mat-1", name: "Lightweight solid ash wood frame", stock: 12 },
          { id: "mat-2", name: "Flexible, high-tensile wool webbing", stock: 20 },
        ],
        dimensions: [
          { id: "dim-1", label: "Height: 74cm | Width: 68cm | Depth: 72cm | Seat Height: 40cm", price: 420 },
        ],
        galleryImages: [
          "/images/yYLWsSIThGzudn2zKw0Wb4koj8_9ad902.png",
        ],
        details: [],
        dimensionsInfo: {
          material: "Solid Ash & Wool Webbing",
          finish: "Clear Wax",
          dimensions: "74 x 68 x 72 cm",
          weight: "12 kg",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Noor Lounge Chair",
        slug: "noor-lounge-chair",
        collectionId: darkCol.id,
        collectionName: darkCol.name,
        collectionSlug: darkCol.slug,
        imageUrl: "/images/vTrJfjXHGV0J4ECovLJuNPdGg8_84abf8.png",
        introText: "Sleek Dark Finishes for Sophisticated Living",
        description: "The Noor Lounge Chair features a matte black stained oak frame and plush, dark charcoal performance fabric cushions. Its low profile and deep seat offer a relaxed, luxurious lounging experience.",
        order: 3,
        favorite: true,
        favoriteOrder: 3,
        materials: [
          { id: "mat-1", name: "Stained black oak frame", stock: 8 },
          { id: "mat-2", name: "Stain-resistant performance fabric cushions", stock: 14 },
        ],
        dimensions: [
          { id: "dim-1", label: "Height: 72cm | Width: 80cm | Depth: 84cm | Seat Height: 38cm", price: 490 },
        ],
        galleryImages: [
          "/images/vTrJfjXHGV0J4ECovLJuNPdGg8_0d3da8.png",
        ],
        details: [],
        dimensionsInfo: {
          material: "Black Stained Oak & Performance Fabric",
          finish: "Matte Black Stain",
          dimensions: "72 x 80 x 84 cm",
          weight: "16 kg",
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Haven Sofa",
        slug: "haven-sofa",
        collectionId: modernCol.id,
        collectionName: modernCol.name,
        collectionSlug: modernCol.slug,
        imageUrl: "/images/yYHBRzt10DB4XejQ5Ryjy1WcDFw_f20830.png",
        introText: "A Sanctuary of Comfort and Style",
        description: "The Haven Sofa is the focal point of the modern home. Its modular construction, subtle curves, and premium boucle fabric provide a luxurious, inviting space for family and friends. Made with solid hardwood frames for ultimate durability.",
        order: 4,
        favorite: false,
        favoriteOrder: null,
        materials: [
          { id: "mat-1", name: "Premium textured boucle upholstery", stock: 5 },
          { id: "mat-2", name: "High-resiliency foam and feather blend fill", stock: 10 },
          { id: "mat-3", name: "Kiln-dried hardwood frame", stock: 10 },
        ],
        dimensions: [
          { id: "dim-1", label: "Height: 70cm | Width: 210cm | Depth: 95cm | Seat Height: 42cm", price: 1200 },
        ],
        galleryImages: [
          "/images/yYHBRzt10DB4XejQ5Ryjy1WcDFw_bf0aec.png",
        ],
        details: [],
        dimensionsInfo: {
          material: "Kiln-Dried Hardwood & Boucle Fabric",
          finish: "Cream Boucle",
          dimensions: "70 x 210 x 95 cm",
          weight: "45 kg",
        },
        createdAt: now,
        updatedAt: now,
      },
    ];

    let insertedCount = 0;
    for (const prod of sampleProducts) {
      await productsCol.updateOne(
        { slug: prod.slug },
        { $set: prod },
        { upsert: true }
      );
      insertedCount++;
      console.log(`Seeded product: ${prod.name} (${prod.slug})`);
    }

    console.log(`Successfully seeded ${insertedCount} products into database '${MONGODB_DB}'!`);
  } catch (error) {
    console.error("Error seeding products:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seedProducts();
