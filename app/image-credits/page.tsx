import entityImageManifest from "@/lib/entity-image-manifest.json";

export default function ImageCreditsPage() {
  return (
    <>
      <div className="topbar">
        <div>
          <h1>Image Credits</h1>
          <p className="muted">Real player portraits and club logos are bundled locally; each image links to its source.</p>
        </div>
      </div>
      <section className="section">
        <h2>Player portraits</h2>
        <div className="grid">
          {Object.entries(entityImageManifest.players).map(([name, image]) => (
            <article className="card" key={name}>
              <h3>{name}</h3>
              <a className="text-link" href={image.sourceUrl} target="_blank" rel="noreferrer">
                View source image on {"sourceProvider" in image ? image.sourceProvider : entityImageManifest.provider}
              </a>
              {"license" in image && typeof image.license === "string" &&
                "licenseUrl" in image && typeof image.licenseUrl === "string" && (
                <p className="muted">
                  {"credit" in image ? `${image.credit} · ` : ""}
                  <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>
                </p>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="section">
        <h2>Club logos</h2>
        <div className="grid">
          {Object.entries(entityImageManifest.clubs).map(([name, image]) => (
            <article className="card" key={name}>
              <h3>{name}</h3>
              <a className="text-link" href={image.sourceUrl} target="_blank" rel="noreferrer">
                View source logo on {"sourceProvider" in image ? image.sourceProvider : entityImageManifest.provider}
              </a>
              {"license" in image && typeof image.license === "string" &&
                "licenseUrl" in image && typeof image.licenseUrl === "string" && (
                <p className="muted">
                  {"credit" in image ? `${image.credit} · ` : ""}
                  <a href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a>
                </p>
              )}
            </article>
          ))}
        </div>
        <p className="muted">
          Club names and marks belong to their respective owners. Their display identifies the clubs and does not imply
          sponsorship or affiliation.
        </p>
      </section>
    </>
  );
}
