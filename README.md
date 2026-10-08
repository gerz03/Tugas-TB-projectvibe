# FOOTBALL IDENTITY

Modern football identity database, career encyclopedia, transfer tracker, comparison tool, leaderboard, admin sync panel, and **MATCH THE PLAYER** game.

## Run Locally

This project uses Neon PostgreSQL so the same database works locally and on Vercel. Create a Neon project, then copy the pooled connection string into `DATABASE_URL` and the direct (non-pooled) connection string into `DIRECT_URL` in `.env`. For Prisma 5, include `pgbouncer=true` in the pooled URL. Keep the credentials private.

```bash
npm install
npm run db:setup
npm run dev
```

Open `http://localhost:3000`.

`npm run db:setup` generates the Prisma client, creates/updates the PostgreSQL schema, and seeds the sample records. It is safe to run more than once. `DATABASE_URL` should use Neon's pooled connection string (with `pgbouncer=true`) for the app; `DIRECT_URL` should use the direct connection string for Prisma schema operations. The sample dataset is intentionally small and is for local evaluation, not a complete or live football data feed.

## GitHub and Vercel Deployment

1. Create a GitHub repository, then initialize and push this project from its folder:

   ```bash
   git init -b main
   git add .
   git status
   git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/REPOSITORY.git
   git push -u origin main
   ```

   Check `git status` before committing: `.env`, `node_modules`, `.next`, and local database files must not be included. `.gitignore` excludes them. Do not force-add secret or generated files.
2. In Vercel, import the GitHub repository as a Next.js project.
3. Add these environment variables in Vercel project settings for every environment you deploy:
   - `DATABASE_URL`: Neon pooled connection string.
   - `DIRECT_URL`: Neon direct connection string.
   - `JWT_SECRET`: a unique random secret with at least 32 characters.
   - `ADMIN_API_KEY`: a long random secret if you use admin import/sync features.
   - `FOOTBALL_API_BASE_URL` and `FOOTBALL_API_KEY` only if a licensed football data provider is configured.
4. Before the first deployment, run `npm run db:setup` from your local project with the Neon URLs in `.env`. This creates the production tables and seeds the starter data. Do not run this command during every Vercel build; the regular `npm run build` generates Prisma Client and builds the Next.js app.
5. Deploy from Vercel. Subsequent pushes to the connected GitHub branch trigger deployments.

The old local `prisma/dev.db` SQLite file is ignored and is not used by the PostgreSQL configuration. Existing custom records in that file are not automatically copied to Neon; export/migrate them separately before switching if they need to be preserved.

## Image Sources and Licenses

Starter player portraits and club logos are individually sourced from Wikimedia Commons/Wikipedia. Attribution and source links are shown with the images and listed at `/image-credits`. Club marks remain the property of their respective clubs and may be trademarked; verify the original file page and obtain permission before commercial reuse. The site needs an internet connection to load remote image files.

Player profiles include selected, season-specific statistics with the competition named and a link to the competition statistics page. The seed covers five player profiles and is a curated sample, not a live feed; seasons and competitions differ by player, and missing data is shown as unavailable rather than as a zero. Configure a licensed provider in the Admin sync settings for broader, up-to-date statistical coverage.

## Admin and Data Sync

Set a long, random `ADMIN_API_KEY` in `.env` before using player/club import or external sync. The Admin dashboard provides forms to add player and club profiles and optional season statistics; no JSON editing is required. Enter the configured key in the dashboard when running an operation; it is sent only with the request and is not saved in the browser. The protected JSON import API also supports player `profile_photo` URLs, club `logo` URLs, and per-player season statistics. Each statistic must include a provider-unique `source_id`, `season`, and `competition`; optional integer statistics must be nonnegative, and `null` explicitly represents an unknown value. Omitted values remain unchanged on sync and unknown on a new import. Club and player references must point to existing database records. Import changes are transactional. Use data only from a provider you are licensed to use. The admin endpoints stay disabled when this key is not configured.

External sync also requires a compatible licensed provider configured with `FOOTBALL_API_BASE_URL` and `FOOTBALL_API_KEY`. The provider must expose `GET {FOOTBALL_API_BASE_URL}/players`, authenticate with a Bearer token, and return a JSON object with a `data` array of players containing `source_id`, `full_name`, `common_name`, and optional `nationality`, `position`, `date_of_birth`, and `profile_photo` fields. Records are inserted or updated by provider/source ID in a transaction. Without those credentials, sync reports that it was skipped and preserves the existing database records.

Provider sync player records may include a `statistics` array. Each statistic requires a provider-unique `source_id`, `season`, and `competition`; `team_type` may be `club` or `national`, and any supplied metric must be a nonnegative integer or `null`. These statistics are imported transactionally and linked to the player's current club when appropriate.

## Accounts

Use `/register` and `/login` to create or access an account. Authentication is stored in an HTTP-only, same-site cookie; set `JWT_SECRET` to a random value at least 32 characters long before production deployment. The profile page tracks account-linked scores, recent games, and unlocked achievements.

## Data Accuracy

The app is seeded only with a small verified starter dataset and metadata fields (`source`, `source_id`, `last_updated`). It does not claim to contain every player or club. Missing fields render as `Data not available`. Configure `.env` with `FOOTBALL_API_BASE_URL` and `FOOTBALL_API_KEY` to connect a licensed provider.

## Database

Prisma uses PostgreSQL. `DATABASE_URL` is the pooled runtime connection and `DIRECT_URL` is the direct connection for Prisma CLI operations such as `db push`. Run `npm run db:setup` after configuring both URLs to create the schema and load the starter data.

See [docs/ERD.md](docs/ERD.md) and [docs/API.md](docs/API.md).
