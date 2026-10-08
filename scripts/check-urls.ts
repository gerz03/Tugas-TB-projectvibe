import { existsSync } from "node:fs";
import { join } from "node:path";
import { starterClubImages, starterPlayerImages } from "../lib/image-attributions";

async function check() {
  let failures = 0;
  let unverified = 0;
  const checkImages = async (kind: string, images: Record<string, { url: string }>) => {
    for (const [name, image] of Object.entries(images)) {
      if (image.url.startsWith("/")) {
        const localPath = join(process.cwd(), "public", image.url.slice(1));
        if (!existsSync(localPath)) {
          console.error(`${kind} FAIL [missing local file]: ${name} -> ${localPath}`);
          failures += 1;
        }
        continue;
      }

      try {
        const response = await fetch(image.url, {
          headers: { "User-Agent": "FootballIdentity/1.0" }
        });
        await response.body?.cancel();
        if (response.status === 429) {
          unverified += 1;
          continue;
        }
        if (!response.ok) {
          console.error(`${kind} FAIL [${response.status}]: ${name} -> ${image.url}`);
          failures += 1;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`${kind} ERR: ${name} -> ${message}`);
        failures += 1;
      }
    }
  };

  console.log("Checking player images...");
  await checkImages("PLAYER", starterPlayerImages);
  console.log("\nChecking club images...");
  await checkImages("CLUB", starterClubImages);
  if (failures) {
    console.error(`\n${failures} image source(s) failed validation.`);
    process.exitCode = 1;
  }
  if (unverified) {
    console.warn(`\n${unverified} external image source(s) could not be verified due to rate limiting.`);
  }
  if (!failures && !unverified) console.log("\nAll image sources are available.");
}

void check();
