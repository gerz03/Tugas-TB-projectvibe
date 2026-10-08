"use client";

import entityImageManifest from "@/lib/entity-image-manifest.json";
import { imageAttributionByUrl, imageSourceReplacements } from "@/lib/image-attributions";

type EntityImageProps = {
  src?: string | null;
  name: string;
  kind: "player" | "club";
  className: string;
};

export function EntityImage({ src, name, kind, className }: EntityImageProps) {
  const bundledImage = kind === "player"
    ? entityImageManifest.players[name as keyof typeof entityImageManifest.players]
    : entityImageManifest.clubs[name as keyof typeof entityImageManifest.clubs];
  const imageSrc = bundledImage?.url ?? (src ? imageSourceReplacements.get(src) ?? src : undefined);
  const attribution = bundledImage
    ? {
        kind,
        credit: [
          "credit" in bundledImage ? bundledImage.credit : undefined,
          "sourceProvider" in bundledImage ? bundledImage.sourceProvider : entityImageManifest.provider,
          "license" in bundledImage ? `(${bundledImage.license})` : undefined
        ].filter(Boolean).join(" / ")
      }
    : src
      ? imageAttributionByUrl.get(src) ?? (imageSrc ? imageAttributionByUrl.get(imageSrc) : undefined)
      : undefined;
  const imageAlt = kind === "player" ? `${name} player portrait` : `${name} club crest`;

  if (!imageSrc) {
    return null;
  }

  return (
    <figure className={`entity-image-frame ${kind}-frame`}>
      <img
        className={`${className} ${kind === "player" ? "player-image" : "club-image"}`}
        src={imageSrc}
        alt={imageAlt}
        loading="lazy"
      />
      {attribution && (
        <figcaption className="entity-image-credit">
          {attribution.kind === "player" ? "Photo" : "Crest"}: {attribution.credit}
        </figcaption>
      )}
    </figure>
  );
}
