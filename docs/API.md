# REST API

- `GET /api/players?page=1&pageSize=12&q=ronaldo&country=Portugal&position=Forward`
- `GET /api/clubs?page=1&pageSize=12&q=real&country=Spain`
- `GET /api/search?q=ronaldo&type=all`
- `GET /api/compare?type=player&a={player_id}&b={player_id}`
- `GET /api/compare?type=club&a={club_id}&b={club_id}`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/game/question` with `{ "mode": "CAREER_CLUB", "difficulty": "EASY", "questionNo": 1, "sessionId": "...optional" }`
- `POST /api/game/answer` with `{ "sessionId": "...", "questionNo": 1, "selectedRefId": "...", "correctRefId": "...", "timeMs": 12000 }`
- `GET /api/leaderboard?range=all`
- `POST /api/admin/import` for JSON/CSV-style record payloads
- `POST /api/admin/sync` to run configured external API sync

Admin imports accept optional `statistics` arrays on each player. Statistics require `source_id`, `season`, and `competition`; metrics are optional nonnegative integers or `null`, so unknown values are not misreported as zero. External `GET {FOOTBALL_API_BASE_URL}/players` responses use the same statistics shape. Every statistic source ID must be stable and unique within its provider so subsequent syncs update rather than duplicate it. Import and sync report record counts including statistics.

Game answers are revalidated server-side from the session seed. Production deployments should hide `correctRefId` from the client and bind answers to a server-stored question table or encrypted token.
