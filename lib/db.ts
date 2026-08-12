import { Pool } from "pg";
import type {
  Post,
  PostInput,
  EventRow,
  Holiday,
  RegulatoryDate,
  BacklogItem,
  Comment,
  RecurringRule,
  WorkTask,
  WorkTaskInput,
} from "./types";

// Works with any Postgres provider (Vercel's Neon-backed Postgres, Supabase,
// Neon directly, etc). Reads the connection string from whichever of these
// env vars is set — same lookup order as work-tracker, so the two apps can
// share hosting conventions even if they end up on separate databases.
//
// Neon connection strings carry `?sslmode=require`. Recent pg-connection-string
// versions treat that as an alias for 'verify-full' and validate the chain
// against Node's default CA store, which rejects Neon's cert with
// "self-signed certificate in certificate chain". Stripping sslmode from the
// string and setting `ssl: { rejectUnauthorized: false }` explicitly avoids
// that — connections still use TLS, just without full chain verification.
const rawConnectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;
const connectionString = rawConnectionString
  ?.replace(/([?&])sslmode=[^&]*&?/i, "$1")
  .replace(/[?&]$/, "");

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

let schemaReady: Promise<void> | null = null;
export async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        platforms JSONB NOT NULL DEFAULT '[]',
        scheduled_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Planned',
        category TEXT,
        caption TEXT NOT NULL DEFAULT '',
        creative_notes TEXT,
        collateral_url TEXT,
        collateral_name TEXT,
        owner TEXT NOT NULL,
        posted_by TEXT,
        tags JSONB NOT NULL DEFAULT '[]',
        region TEXT,
        linked_event_id INTEGER,
        backlog_item_ids JSONB NOT NULL DEFAULT '[]',
        post_live_link TEXT,
        notes TEXT,
        style_warnings JSONB NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      );
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        event_date TEXT NOT NULL,
        creative_suggestion TEXT,
        pre_post_id INTEGER,
        post_post_id INTEGER,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS holidays (
        id SERIAL PRIMARY KEY,
        occasion TEXT NOT NULL,
        date TEXT,
        region TEXT NOT NULL,
        location TEXT,
        status_at_location TEXT NOT NULL DEFAULT 'Public',
        post_trigger BOOLEAN NOT NULL DEFAULT false,
        is_weekend BOOLEAN NOT NULL DEFAULT false,
        tbc BOOLEAN NOT NULL DEFAULT false,
        source TEXT NOT NULL DEFAULT 'upload',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS regulatory_dates (
        id SERIAL PRIMARY KEY,
        occasion TEXT NOT NULL,
        date TEXT NOT NULL,
        region TEXT NOT NULL,
        service_line TEXT NOT NULL,
        product TEXT,
        notes TEXT
      );
      CREATE TABLE IF NOT EXISTS backlog_items (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        tags JSONB NOT NULL DEFAULT '[]',
        used_in_post_ids JSONB NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        author TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS recurring_rules (
        id SERIAL PRIMARY KEY,
        content_type TEXT NOT NULL,
        cadence TEXT NOT NULL,
        target_day_rule TEXT,
        finalize_by_rule TEXT,
        region TEXT,
        gap_fill_interval_days INTEGER NOT NULL DEFAULT 15,
        last_post_date TEXT
      );
      CREATE TABLE IF NOT EXISTS dismissed_suggestions (
        key TEXT PRIMARY KEY,
        dismissed_at TEXT NOT NULL
      );
      -- Safety net for a table created before the category column existed —
      -- harmless no-op once it's already there.
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS category TEXT;
      ALTER TABLE posts ADD COLUMN IF NOT EXISTS format TEXT;
      CREATE TABLE IF NOT EXISTS work_tasks (
        id SERIAL PRIMARY KEY, task_date TEXT, task TEXT NOT NULL, category TEXT, poc TEXT,
        due_date TEXT, assigned_to TEXT, priority TEXT NOT NULL DEFAULT 'Low', notes TEXT,
        archived_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

export function getPool() {
  return pool;
}

// ---------- Posts ----------

export async function listPosts(): Promise<Post[]> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM posts ORDER BY scheduled_date ASC, id ASC;");
  return rows as Post[];
}

export async function getPost(id: number): Promise<Post | null> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM posts WHERE id = $1;", [id]);
  return (rows[0] as Post) || null;
}

export async function createPost(input: PostInput, styleWarnings: string[]): Promise<Post> {
  await ensureSchema();
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO posts (
      platforms, scheduled_date, status, category, format, caption, creative_notes, collateral_url,
      collateral_name, owner, posted_by, tags, region, linked_event_id,
      backlog_item_ids, post_live_link, notes, style_warnings, created_at, updated_at, archived_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
    RETURNING *;`,
    [
      JSON.stringify(input.platforms || []),
      input.scheduled_date,
      input.status || "Planned",
      input.category ?? null,
      input.format ?? null,
      input.caption || "",
      input.creative_notes ?? null,
      input.collateral_url ?? null,
      input.collateral_name ?? null,
      input.owner,
      input.posted_by ?? null,
      JSON.stringify(input.tags || []),
      input.region ?? null,
      input.linked_event_id ?? null,
      JSON.stringify(input.backlog_item_ids || []),
      input.post_live_link ?? null,
      input.notes ?? null,
      JSON.stringify(styleWarnings),
      now,
      now,
      input.status === "Archived" ? now : null,
    ]
  );
  return rows[0] as Post;
}

export async function updatePost(
  id: number,
  input: PostInput,
  styleWarnings: string[] | null
): Promise<Post | null> {
  await ensureSchema();
  const existing = await getPost(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const merged: Post = { ...existing, ...input, updated_at: now } as Post;
  if (styleWarnings) merged.style_warnings = styleWarnings;
  // Posted is a manual flip only (PRD §5) — never auto-set by the scheduled
  // date. The moment an editor flips it, the system automatically soft-
  // archives it (§5, §7.4): we keep the status literally "Posted" (so the
  // UI can still say who posted it and when) and record archived_at at the
  // same instant. The Archive view is just "WHERE archived_at IS NOT NULL",
  // not a separate status value — that keeps "who posted it" and "is it
  // archived" as two independently-true facts instead of overwriting one.
  if (merged.status === "Posted" && existing.status !== "Posted") {
    merged.posted_by = input.posted_by || existing.posted_by;
  }
  const archived_at =
    merged.status === "Posted" || merged.status === "Archived"
      ? existing.archived_at || now
      : null;
  const { rows } = await pool.query(
    `UPDATE posts SET
      platforms=$1, scheduled_date=$2, status=$3, category=$4, format=$5, caption=$6, creative_notes=$7,
      collateral_url=$8, collateral_name=$9, owner=$10, posted_by=$11, tags=$12,
      region=$13, linked_event_id=$14, backlog_item_ids=$15, post_live_link=$16,
      notes=$17, style_warnings=$18, updated_at=$19, archived_at=$20
    WHERE id=$21 RETURNING *;`,
    [
      JSON.stringify(merged.platforms || []),
      merged.scheduled_date,
      merged.status,
      merged.category ?? null,
      merged.format ?? null,
      merged.caption,
      merged.creative_notes,
      merged.collateral_url,
      merged.collateral_name,
      merged.owner,
      merged.posted_by,
      JSON.stringify(merged.tags || []),
      merged.region,
      merged.linked_event_id,
      JSON.stringify(merged.backlog_item_ids || []),
      merged.post_live_link,
      merged.notes,
      JSON.stringify(merged.style_warnings || []),
      merged.updated_at,
      archived_at,
      id,
    ]
  );
  return rows[0] as Post;
}

// Hard delete, restricted to archived entries — matches the team's decision
// that editors may permanently remove individual archived posts, while the
// active pipeline (§5's "retained, not deleted" principle) stays intact for
// anything not yet archived.
export async function deletePost(id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await pool.query("DELETE FROM posts WHERE id = $1 AND archived_at IS NOT NULL;", [id]);
  return (rowCount ?? 0) > 0;
}

export async function clonePost(id: number, owner: string): Promise<Post | null> {
  const src = await getPost(id);
  if (!src) return null;
  return createPost(
    {
      platforms: src.platforms,
      scheduled_date: src.scheduled_date,
      status: "Planned",
      category: src.category,
      format: src.format,
      caption: src.caption,
      creative_notes: src.creative_notes,
      collateral_url: src.collateral_url,
      collateral_name: src.collateral_name,
      owner,
      tags: src.tags,
      region: src.region,
      linked_event_id: null,
      backlog_item_ids: src.backlog_item_ids,
      post_live_link: null,
      notes: src.notes,
    },
    src.style_warnings || []
  );
}

// ---------- Events ----------

export async function listEvents(): Promise<EventRow[]> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM events ORDER BY event_date ASC;");
  return rows as EventRow[];
}

export async function createEvent(
  name: string,
  event_date: string,
  creative_suggestion: string | null,
  owner: string
): Promise<EventRow> {
  await ensureSchema();
  const now = new Date().toISOString();

  // Auto-generate the two linked posts described in PRD §10: pre-event due
  // the day before, post-event due the same day or the day after. Both
  // inherit the event's date so due dates are computed, not hand-set.
  const dayMs = 24 * 60 * 60 * 1000;
  const eventDate = new Date(event_date + "T00:00:00Z");
  const preDate = new Date(eventDate.getTime() - dayMs).toISOString().slice(0, 10);
  const postDate = new Date(eventDate.getTime() + dayMs).toISOString().slice(0, 10);

  const pre = await createPost(
    {
      platforms: ["LinkedIn"],
      scheduled_date: preDate,
      status: "Planned",
      caption: "",
      creative_notes: creative_suggestion,
      owner,
      tags: ["event"],
      notes: `Pre-event post for "${name}".`,
    },
    []
  );
  const post = await createPost(
    {
      platforms: ["LinkedIn"],
      scheduled_date: postDate,
      status: "Planned",
      caption: "",
      creative_notes: creative_suggestion,
      owner,
      tags: ["event"],
      notes: `Post-event recap for "${name}".`,
    },
    []
  );

  const { rows } = await pool.query(
    `INSERT INTO events (name, event_date, creative_suggestion, pre_post_id, post_post_id, created_at)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`,
    [name, event_date, creative_suggestion, pre.id, post.id, now]
  );
  const event = rows[0] as EventRow;

  await pool.query("UPDATE posts SET linked_event_id = $1 WHERE id IN ($2, $3);", [
    event.id,
    pre.id,
    post.id,
  ]);

  return event;
}

// ---------- Holidays ----------

export async function listHolidays(): Promise<Holiday[]> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM holidays ORDER BY date ASC NULLS LAST, occasion ASC;");
  return rows as Holiday[];
}

export async function createHoliday(h: Omit<Holiday, "id" | "created_at">): Promise<Holiday> {
  await ensureSchema();
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO holidays (occasion, date, region, location, status_at_location, post_trigger, is_weekend, tbc, source, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;`,
    [
      h.occasion,
      h.date,
      h.region,
      h.location,
      h.status_at_location,
      h.post_trigger,
      h.is_weekend,
      h.tbc,
      h.source,
      now,
    ]
  );
  return rows[0] as Holiday;
}

// Covers both the post_trigger correction case (the seed's editorial calls
// are a starting point, not gospel) and filling in a TBC entry's real date
// once the Ministry announces it (PRD §12.3).
export async function updateHoliday(
  id: number,
  patch: Partial<Pick<Holiday, "date" | "post_trigger" | "status_at_location" | "tbc" | "is_weekend">>
): Promise<Holiday | null> {
  await ensureSchema();
  const { rows: existingRows } = await pool.query("SELECT * FROM holidays WHERE id = $1;", [id]);
  if (!existingRows[0]) return null;
  const merged = { ...existingRows[0], ...patch };
  if (patch.date !== undefined) merged.tbc = !patch.date;
  const { rows } = await pool.query(
    `UPDATE holidays SET date=$1, post_trigger=$2, status_at_location=$3, tbc=$4, is_weekend=$5 WHERE id=$6 RETURNING *;`,
    [merged.date, merged.post_trigger, merged.status_at_location, merged.tbc, merged.is_weekend, id]
  );
  return rows[0] as Holiday;
}

export async function countHolidays(): Promise<number> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM holidays;");
  return rows[0].c as number;
}

// ---------- Regulatory dates ----------

export async function listRegulatoryDates(): Promise<RegulatoryDate[]> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM regulatory_dates ORDER BY date ASC;");
  return rows as RegulatoryDate[];
}

export async function createRegulatoryDate(r: Omit<RegulatoryDate, "id">): Promise<RegulatoryDate> {
  await ensureSchema();
  const { rows } = await pool.query(
    `INSERT INTO regulatory_dates (occasion, date, region, service_line, product, notes)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *;`,
    [r.occasion, r.date, r.region, r.service_line, r.product, r.notes]
  );
  return rows[0] as RegulatoryDate;
}

export async function countRegulatoryDates(): Promise<number> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM regulatory_dates;");
  return rows[0].c as number;
}

// ---------- Backlog ----------

export async function listBacklog(): Promise<BacklogItem[]> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM backlog_items ORDER BY created_at DESC;");
  return rows as BacklogItem[];
}

export async function createBacklogItem(
  title: string,
  description: string | null,
  tags: string[]
): Promise<BacklogItem> {
  await ensureSchema();
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO backlog_items (title, description, tags, used_in_post_ids, created_at)
     VALUES ($1,$2,$3,'[]',$4) RETURNING *;`,
    [title, description, JSON.stringify(tags), now]
  );
  return rows[0] as BacklogItem;
}

export async function markBacklogUsed(id: number, postId: number): Promise<void> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT used_in_post_ids FROM backlog_items WHERE id = $1;", [id]);
  if (!rows[0]) return;
  const used: number[] = rows[0].used_in_post_ids || [];
  if (!used.includes(postId)) used.push(postId);
  await pool.query("UPDATE backlog_items SET used_in_post_ids = $1 WHERE id = $2;", [
    JSON.stringify(used),
    id,
  ]);
}

export async function deleteBacklogItem(id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await pool.query("DELETE FROM backlog_items WHERE id = $1;", [id]);
  return (rowCount ?? 0) > 0;
}

// ---------- Comments ----------

export async function listComments(postId: number): Promise<Comment[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    "SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC;",
    [postId]
  );
  return rows as Comment[];
}

export async function addComment(postId: number, author: string, body: string): Promise<Comment> {
  await ensureSchema();
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO comments (post_id, author, body, created_at) VALUES ($1,$2,$3,$4) RETURNING *;`,
    [postId, author, body, now]
  );
  return rows[0] as Comment;
}

// ---------- Recurring rules ----------

export async function listRecurringRules(): Promise<RecurringRule[]> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM recurring_rules ORDER BY id ASC;");
  return rows as RecurringRule[];
}

export async function createRecurringRule(
  r: Omit<RecurringRule, "id">
): Promise<RecurringRule> {
  await ensureSchema();
  const { rows } = await pool.query(
    `INSERT INTO recurring_rules (content_type, cadence, target_day_rule, finalize_by_rule, region, gap_fill_interval_days, last_post_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *;`,
    [r.content_type, r.cadence, r.target_day_rule, r.finalize_by_rule, r.region, r.gap_fill_interval_days, r.last_post_date]
  );
  return rows[0] as RecurringRule;
}

export async function countRecurringRules(): Promise<number> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT COUNT(*)::int AS c FROM recurring_rules;");
  return rows[0].c as number;
}

// ---------- Dismissible suggestion tracking ----------
// Gap-fill / holiday / regulatory suggestions are dismissible with no
// consequence (PRD §8). We track dismissals by a stable key so a dismissed
// suggestion doesn't reappear on every page load.

export async function isDismissed(key: string): Promise<boolean> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT 1 FROM dismissed_suggestions WHERE key = $1;", [key]);
  return rows.length > 0;
}

export async function dismissSuggestion(key: string): Promise<void> {
  await ensureSchema();
  await pool.query(
    "INSERT INTO dismissed_suggestions (key, dismissed_at) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING;",
    [key, new Date().toISOString()]
  );
}

export async function listDismissed(): Promise<string[]> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT key FROM dismissed_suggestions;");
  return rows.map((r) => r.key as string);
}

// ---------- Work Tracker tasks ----------
// Stored locally now (previously proxied to the retired work-tracker-drab
// app) — see app/api/worktracker/tasks/*.

export async function listWorkTasks(archived: boolean): Promise<WorkTask[]> {
  await ensureSchema();
  const { rows } = await pool.query(
    archived
      ? "SELECT * FROM work_tasks WHERE archived_at IS NOT NULL ORDER BY due_date ASC, id ASC;"
      : "SELECT * FROM work_tasks WHERE archived_at IS NULL ORDER BY due_date ASC, id ASC;"
  );
  return rows as WorkTask[];
}

export async function getWorkTask(id: number): Promise<WorkTask | null> {
  await ensureSchema();
  const { rows } = await pool.query("SELECT * FROM work_tasks WHERE id = $1;", [id]);
  return (rows[0] as WorkTask) || null;
}

export async function createWorkTask(input: WorkTaskInput): Promise<WorkTask> {
  await ensureSchema();
  const now = new Date().toISOString();
  const { rows } = await pool.query(
    `INSERT INTO work_tasks (task_date, task, category, poc, due_date, assigned_to, priority, notes, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *;`,
    [
      input.task_date ?? null,
      input.task || "",
      input.category ?? null,
      input.poc ?? null,
      input.due_date ?? null,
      input.assigned_to ?? null,
      input.priority || "Low",
      input.notes ?? null,
      now,
      now,
    ]
  );
  return rows[0] as WorkTask;
}

export async function updateWorkTask(
  id: number,
  patch: WorkTaskInput & { action?: string; status?: string }
): Promise<WorkTask | null> {
  await ensureSchema();
  const existing = await getWorkTask(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const merged: WorkTask = { ...existing, ...patch, updated_at: now };
  if (patch.action === "restore") {
    merged.archived_at = null;
  } else if (patch.status === "Completed") {
    merged.archived_at = existing.archived_at || now;
  }
  const { rows } = await pool.query(
    `UPDATE work_tasks SET task_date=$1, task=$2, category=$3, poc=$4, due_date=$5, assigned_to=$6, priority=$7, notes=$8, archived_at=$9, updated_at=$10
     WHERE id=$11 RETURNING *;`,
    [
      merged.task_date,
      merged.task,
      merged.category,
      merged.poc,
      merged.due_date,
      merged.assigned_to,
      merged.priority,
      merged.notes,
      merged.archived_at,
      merged.updated_at,
      id,
    ]
  );
  return rows[0] as WorkTask;
}

export async function deleteWorkTask(id: number): Promise<boolean> {
  await ensureSchema();
  const { rowCount } = await pool.query("DELETE FROM work_tasks WHERE id = $1;", [id]);
  return (rowCount ?? 0) > 0;
}
