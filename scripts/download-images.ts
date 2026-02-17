import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const prisma = new PrismaClient();

const DOWNLOAD_DIR = path.join(__dirname, "../public/products");
const CONCURRENCY = 3; // lower concurrency to avoid rate limiting
const DELAY_MS = 200; // delay between batches

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function downloadFile(url: string, dest: string): Promise<boolean> {
  return new Promise((resolve) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const client = url.startsWith("https") ? https : http;
    const request = client.get(
      url,
      {
        timeout: 20000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
      (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl, dest).then(resolve);
            return;
          }
        }

        if (response.statusCode !== 200) {
          resolve(false);
          return;
        }

        const file = fs.createWriteStream(dest);
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          const stats = fs.statSync(dest);
          if (stats.size < 100) {
            fs.unlinkSync(dest);
            resolve(false);
          } else {
            resolve(true);
          }
        });
        file.on("error", () => {
          fs.unlink(dest, () => {});
          resolve(false);
        });
      }
    );

    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function main() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }

  const products = await prisma.product.findMany({
    select: { id: true, sku: true, images: true },
  });

  console.log(`Found ${products.length} products to process`);

  let downloaded = 0;
  let failed = 0;
  let alreadyLocal = 0;
  let noImage = 0;

  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const batch = products.slice(i, i + CONCURRENCY);

    await Promise.all(
      batch.map(async (product) => {
        if (product.images.length === 0) {
          noImage++;
          return;
        }

        const newImages: string[] = [];

        for (const imageUrl of product.images) {
          // Already local
          if (imageUrl.startsWith("/products/")) {
            newImages.push(imageUrl);
            alreadyLocal++;
            continue;
          }

          const urlPath = new URL(imageUrl).pathname;
          const ext = path.extname(urlPath) || ".png";
          const filename = `${product.sku.replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`;
          const destPath = path.join(DOWNLOAD_DIR, filename);
          const publicPath = `/products/${filename}`;

          // Already downloaded
          if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
            newImages.push(publicPath);
            alreadyLocal++;
            // Update DB to local path
            await prisma.product.update({
              where: { id: product.id },
              data: { images: [publicPath] },
            });
            continue;
          }

          const success = await downloadFile(imageUrl, destPath);
          if (success) {
            newImages.push(publicPath);
            downloaded++;
          } else {
            // Keep remote URL as fallback
            newImages.push(imageUrl);
            failed++;
          }
        }

        await prisma.product.update({
          where: { id: product.id },
          data: { images: newImages },
        });
      })
    );

    const total = i + batch.length;
    if (total % 50 === 0 || total === products.length) {
      console.log(
        `Progress: ${total}/${products.length} | Downloaded: ${downloaded} | Already local: ${alreadyLocal} | Failed: ${failed}`
      );
    }

    // Delay between batches to avoid rate limiting
    if (failed < 5 || (i > 0 && i % 100 === 0)) {
      await sleep(DELAY_MS);
    } else {
      await sleep(500); // longer delay if we're getting failures
    }
  }

  console.log(`\n--- Download complete ---`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Already local: ${alreadyLocal}`);
  console.log(`Failed (kept remote URL): ${failed}`);
  console.log(`No image: ${noImage}`);

  const files = fs.readdirSync(DOWNLOAD_DIR);
  const totalSize = files.reduce(
    (sum, f) => sum + fs.statSync(path.join(DOWNLOAD_DIR, f)).size,
    0
  );
  console.log(`Total files: ${files.length}`);
  console.log(`Total disk usage: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
}

main()
  .catch((e) => {
    console.error("Download failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
