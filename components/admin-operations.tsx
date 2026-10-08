"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type ClubOption = {
  club_id: string;
  common_name: string;
};

type AdminOperationsProps = {
  clubs: ClubOption[];
  adminEnabled: boolean;
  providerConfigured: boolean;
};

type OperationResult = {
  ok: boolean;
  message: string;
};

const statisticMetrics = [
  ["appearances", "Appearances"],
  ["starts", "Starts"],
  ["minutes_played", "Minutes played"],
  ["goals", "Goals"],
  ["assists", "Assists"],
  ["yellow_cards", "Yellow cards"],
  ["red_cards", "Red cards"],
  ["clean_sheets", "Clean sheets"],
  ["shots", "Shots"],
  ["shots_on_target", "Shots on target"],
  ["passes", "Passes"],
  ["key_passes", "Key passes"],
  ["tackles", "Tackles"],
  ["interceptions", "Interceptions"],
  ["duels_won", "Duels won"],
  ["dribbles", "Successful dribbles"],
  ["penalties", "Penalties scored"],
  ["own_goals", "Own goals"],
  ["fouls", "Fouls"]
] as const;

export function AdminOperations({ clubs, adminEnabled, providerConfigured }: AdminOperationsProps) {
  const router = useRouter();
  const [activeForm, setActiveForm] = useState<"player" | "club" | "sync">("player");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OperationResult | null>(null);

  async function submitImport(event: FormEvent<HTMLFormElement>, kind: "player" | "club") {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    setResult(null);

    const source = String(form.get("source") || "Admin dashboard");
    const season = String(form.get("season") || "").trim();
    const competition = String(form.get("competition") || "").trim();
    const statistics = statisticMetrics.reduce<Record<string, number | undefined>>((metrics, [key]) => {
      const value = String(form.get(key) ?? "");
      metrics[key] = value === "" ? undefined : Number(value);
      return metrics;
    }, {});
    if (kind === "player" && Boolean(season) !== Boolean(competition)) {
      setBusy(false);
      setResult({ ok: false, message: "Enter both the season and competition, or leave both blank." });
      return;
    }
    const record = kind === "player"
      ? {
          full_name: String(form.get("full_name")),
          common_name: String(form.get("common_name") || form.get("full_name")),
          source_id: String(form.get("source_id") || "") || undefined,
          nationality: String(form.get("nationality") || "") || undefined,
          position: String(form.get("position") || "") || undefined,
          date_of_birth: String(form.get("date_of_birth") || "") || undefined,
          current_club_id: String(form.get("current_club_id") || "") || undefined,
          profile_photo: String(form.get("profile_photo") || "") || undefined,
          source,
          statistics: season
            ? [{
                source_id: String(form.get("stat_source_id") || crypto.randomUUID()),
                season,
                competition,
                team_type: String(form.get("team_type") || "club"),
                club_id: String(form.get("stat_club_id") || "") || undefined,
                ...statistics
              }]
            : undefined
        }
      : {
          official_name: String(form.get("official_name")),
          common_name: String(form.get("common_name") || form.get("official_name")),
          country_name: String(form.get("country_name") || "") || undefined,
          city: String(form.get("city") || "") || undefined,
          logo: String(form.get("logo") || "") || undefined,
          website: String(form.get("website") || "") || undefined,
          source
        };

    try {
      const response = await fetch("/api/admin/import", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(kind === "player" ? { players: [record] } : { clubs: [record] })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Data could not be saved.");
      const data = payload.data;
      setResult({
        ok: true,
        message: kind === "player"
          ? `Player saved${data.statistics_imported ? ` with ${data.statistics_imported} season statistic` : ""}.`
          : "Club saved."
      });
      formElement.reset();
      router.refresh();
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "Data could not be saved." });
    } finally {
      setBusy(false);
    }
  }

  async function runSync() {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
        headers: { Authorization: "Bearer " + apiKey }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Synchronization failed.");
      const data = payload.data;
      if (data.status !== "success") throw new Error(data.error_message ?? "The provider sync did not complete.");
      setResult({ ok: true, message: `Sync complete: ${data.records_changed} records updated from ${data.source}.` });
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : "Synchronization failed." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section admin-workspace">
      <div className="admin-workspace-heading">
        <div>
          <p className="admin-eyebrow">MANAGE YOUR DATABASE</p>
          <h2>Data management</h2>
          <p className="muted">Add records using the form or update them from your connected provider.</p>
        </div>
        <span className={`admin-status-pill${adminEnabled ? " is-ready" : " is-warning"}`}>
          <span aria-hidden="true" />{adminEnabled ? "Admin access enabled" : "Setup required"}
        </span>
      </div>

      {!adminEnabled && (
        <div className="admin-notice" role="status">
          <strong>Admin actions are not enabled yet.</strong>
          <span>Set <code>ADMIN_API_KEY</code> to a private, random value in your local <code>.env</code> file, then restart the app. Replace the placeholder value if you copied it from <code>.env.example</code>.</span>
        </div>
      )}

      <div className="card admin-key-card">
        <label htmlFor="admin-api-key">Admin access key</label>
        <input
          className="search admin-key-input"
          id="admin-api-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder="Enter the ADMIN_API_KEY configured on this server"
          disabled={!adminEnabled}
        />
        <p className="muted">The key is used only for your request and is not saved in the browser.</p>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Data management actions">
        <button type="button" role="tab" aria-selected={activeForm === "player"} className={`admin-tab${activeForm === "player" ? " is-active" : ""}`} onClick={() => { setActiveForm("player"); setResult(null); }}>Add player</button>
        <button type="button" role="tab" aria-selected={activeForm === "club"} className={`admin-tab${activeForm === "club" ? " is-active" : ""}`} onClick={() => { setActiveForm("club"); setResult(null); }}>Add club</button>
        <button type="button" role="tab" aria-selected={activeForm === "sync"} className={`admin-tab${activeForm === "sync" ? " is-active" : ""}`} onClick={() => { setActiveForm("sync"); setResult(null); }}>Provider sync</button>
      </div>

      <div className="card admin-form-card">
        {activeForm === "player" && (
          <form className="admin-form" onSubmit={(event) => void submitImport(event, "player")}>
            <div className="admin-form-title">
              <h3>Player details</h3>
              <p className="muted">Fields marked required must be filled in.</p>
            </div>
            <div className="admin-form-grid">
              <label>Full name <span>Required</span><input name="full_name" required maxLength={160} placeholder="e.g. Alex Morgan" /></label>
              <label>Display name<input name="common_name" maxLength={120} placeholder="Same as full name if blank" /></label>
              <label>Nationality<input name="nationality" maxLength={80} placeholder="e.g. United States" /></label>
              <label>Position<input name="position" maxLength={80} placeholder="e.g. Forward" /></label>
              <label>Date of birth<input name="date_of_birth" type="date" /></label>
              <label>Current club
                <select name="current_club_id" defaultValue="">
                  <option value="">No club selected</option>
                  {clubs.map((club) => <option key={club.club_id} value={club.club_id}>{club.common_name}</option>)}
                </select>
              </label>
              <label>Player photo URL<input name="profile_photo" type="url" placeholder="https://…" /></label>
              <label>Data source<input name="source" defaultValue="Admin dashboard" maxLength={120} /></label>
              <label>Provider player ID <span>Optional</span><input name="source_id" maxLength={160} placeholder="For matching future provider updates" /></label>
            </div>

            <details className="admin-statistics">
              <summary>Add season statistics <span>Optional</span></summary>
              <p className="muted">Leave this section closed if statistics are not available. Blank metrics remain unknown.</p>
              <div className="admin-form-grid">
                <label>Season<input name="season" maxLength={40} placeholder="e.g. 2025/26" /></label>
                <label>Competition<input name="competition" maxLength={120} placeholder="e.g. Premier League" /></label>
                <label>Team type
                  <select name="team_type" defaultValue="club">
                    <option value="club">Club</option>
                    <option value="national">National team</option>
                  </select>
                </label>
                <label>Club for this season
                  <select name="stat_club_id" defaultValue="">
                    <option value="">Use current club</option>
                    {clubs.map((club) => <option key={club.club_id} value={club.club_id}>{club.common_name}</option>)}
                  </select>
                </label>
                {statisticMetrics.map(([key, label]) => (
                  <label key={key}>{label}<input name={key} type="number" min="0" step="1" placeholder="Unknown" /></label>
                ))}
                <label>Provider statistic ID <span>Optional</span><input name="stat_source_id" maxLength={160} placeholder="Generated if blank" /></label>
              </div>
            </details>
            <div className="admin-form-actions">
              <button className="button" type="submit" disabled={busy || !adminEnabled || !apiKey}>{busy ? "Saving…" : "Save player"}</button>
              {!apiKey && adminEnabled && <span className="muted">Enter the admin access key to continue.</span>}
            </div>
          </form>
        )}

        {activeForm === "club" && (
          <form className="admin-form" onSubmit={(event) => void submitImport(event, "club")}>
            <div className="admin-form-title">
              <h3>Club details</h3>
              <p className="muted">Add the club profile, crest, and official website.</p>
            </div>
            <div className="admin-form-grid">
              <label>Official club name <span>Required</span><input name="official_name" required maxLength={180} placeholder="e.g. Example Football Club" /></label>
              <label>Display name <span>Optional</span><input name="common_name" maxLength={120} placeholder="Same as official name if blank" /></label>
              <label>Country<input name="country_name" maxLength={80} placeholder="e.g. England" /></label>
              <label>City<input name="city" maxLength={100} placeholder="e.g. London" /></label>
              <label>Club crest URL<input name="logo" type="url" placeholder="https://…" /></label>
              <label>Official website<input name="website" type="url" placeholder="https://…" /></label>
              <label>Data source<input name="source" defaultValue="Admin dashboard" maxLength={120} /></label>
            </div>
            <div className="admin-form-actions">
              <button className="button" type="submit" disabled={busy || !adminEnabled || !apiKey}>{busy ? "Saving…" : "Save club"}</button>
              {!apiKey && adminEnabled && <span className="muted">Enter the admin access key to continue.</span>}
            </div>
          </form>
        )}

        {activeForm === "sync" && (
          <div className="admin-sync-panel">
            <div className="admin-sync-icon" aria-hidden="true">↻</div>
            <h3>Update data from your provider</h3>
            <p className="muted">Fetch player profiles and season statistics from the provider configured for this app. Existing records are matched by provider IDs.</p>
            <p className={`admin-provider-status${providerConfigured ? " is-ready" : " is-warning"}`}>
              {providerConfigured ? "Provider connection is configured." : "Provider connection is not configured yet."}
            </p>
            {!providerConfigured && <p className="muted">Set <code>FOOTBALL_API_BASE_URL</code> and <code>FOOTBALL_API_KEY</code> in <code>.env</code>, then restart the app.</p>}
            <button className="button" type="button" disabled={busy || !adminEnabled || !providerConfigured || !apiKey} onClick={() => void runSync()}>
              {busy ? "Synchronizing…" : "Synchronize now"}
            </button>
            {!apiKey && adminEnabled && <p className="muted">Enter the admin access key above to continue.</p>}
          </div>
        )}

        {result && <div className={`admin-feedback${result.ok ? " is-success" : " is-error"}`} role={result.ok ? "status" : "alert"}>{result.message}</div>}
      </div>
    </section>
  );
}
