import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import * as https from "https";
import * as http from "http";

const prisma = new PrismaClient();
const DOWNLOAD_DIR = path.join(__dirname, "../public/products");

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
          Accept: "image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
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

  // Only get products with remote URLs
  const products = await prisma.product.findMany({
    select: { id: true, sku: true, images: true },
  });

  const remoteProducts = products.filter(
    (p) => p.images.length > 0 && !p.images[0].startsWith("/products/")
  );

  console.log(`${remoteProducts.length} products need image download`);

  let downloaded = 0;
  let failed = 0;

  // Download ONE at a time with delay
  for (let i = 0; i < remoteProducts.length; i++) {
    const product = remoteProducts[i];
    const imageUrl = product.images[0];

    try {
      const urlPath = new URL(imageUrl).pathname;
      const ext = path.extname(urlPath) || ".png";
      const filename = `${product.sku.replace(/[^a-zA-Z0-9_-]/g, "_")}${ext}`;
      const destPath = path.join(DOWNLOAD_DIR, filename);
      const publicPath = `/products/${filename}`;

      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
        await prisma.product.update({
          where: { id: product.id },
          data: { images: [publicPath] },
        });
        downloaded++;
      } else {
        const success = await downloadFile(imageUrl, destPath);
        if (success) {
          await prisma.product.update({
            where: { id: product.id },
            data: { images: [publicPath] },
          });
          downloaded++;
        } else {
          failed++;
        }
      }
    } catch (e: any) {
      failed++;
    }

    if ((i + 1) % 50 === 0) {
      console.log(
        `Progress: ${i + 1}/${remoteProducts.length} | OK: ${downloaded} | Failed: ${failed}`
      );
    }

    // 500ms delay between each download
    await sleep(500);
  }

  console.log(`\n--- Done ---`);
  console.log(`Downloaded: ${downloaded}`);
  console.log(`Failed: ${failed}`);

  const files = fs.readdirSync(DOWNLOAD_DIR);
  console.log(`Total local files: ${files.length}`);
  const totalSize = files.reduce(
    (sum, f) => sum + fs.statSync(path.join(DOWNLOAD_DIR, f)).size,
    0
  );
  console.log(`Disk usage: ${(totalSize / 1024 / 1024).toFixed(1)} MB`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
