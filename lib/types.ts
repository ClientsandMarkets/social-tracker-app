// Shared domain types. Dates are plain ISO strings ("YYYY-MM-DD"), matching
// the existing work-tracker convention — no Date objects cross the API
// boundary, so there's no timezone conversion to get wrong anywhere.

export const EDITORS = ["Damini", "Jimmy", "Twinkle", "Prachi"] as const;
export type Editor = (typeof EDITORS)[number];

export const PLATFORMS = ["LinkedIn", "Instagram", "X", "YouTube", "Website"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const STATUSES = [
  "Planned",
  "In progress",
  "Ready",
  "Posted",
  "Archived",
] as const;
export type PostStatus = (typeof STATUSES)[number];

// Distinct region tags per the team's decision: KSA/UAE/Qatar stay separate;
// "Middle East" is its own value used only when content applies to all three
// at once, not a default umbrella for any one of them.
export const REGIONS = [
  "India",
  "USA",
  "UAE",
  "KSA",
  "Qatar",
  "Middle East",
  "Global",
] as const;
export type Region = (typeof REGIONS)[number];

// Content category — a separate axis from tags, for quick tracking/reporting
// ("how many People posts this quarter", "any Awards content pending").
// "Other" is the deliberate catch-all: pick it and note specifics in tags if
// a post doesn't fit the named buckets — extend this list rather than
// overloading "Other" if a category keeps recurring.
export const CATEGORIES = [
  "People News",
  "Event",
  "Thought Leadership",
  "Awards",
  "Podcast",
  "New Service/Asset",
  "Existing Service/Asset",
  "Partnership/Client",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const FORMATS = ["Carousel", "Static", "Video"] as const;
export type Format = (typeof FORMATS)[number];

export type Post = {
  id: number;
  platforms: Platform[];
  scheduled_date: string; // YYYY-MM-DD
  status: PostStatus;
  category: Category | null;
  format: Format | null;
  caption: string;
  creative_notes: string | null;
  collateral_url: string | null;
  collateral_name: string | null;
  owner: string; // scheduled by
  posted_by: string | null; // set on manual flip to Posted
  tags: string[]; // theme / campaign tags
  region: Region | null;
  linked_event_id: number | null;
  backlog_item_ids: number[]; // idea-backlog items pulled into this post; can be several
  post_live_link: string | null;
  notes: string | null;
  style_warnings: string[]; // last-computed soft warnings, editor can override
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

export type PostInput = Partial<
  Omit<Post, "id" | "created_at" | "updated_at" | "archived_at" | "style_warnings">
>;

export type EventRow = {
  id: number;
  name: string;
  event_date: string;
  creative_suggestion: string | null;
  pre_post_id: number | null;
  post_post_id: number | null;
  created_at: string;
};

// India carries per-location status; the other four regions use a single
// "Public" status with no location. Eid Al Fitr / Eid Al Adha for Qatar, KSA,
// and UAE load with date = null and tbc = true (the source calendars don't
// publish even a provisional date, only a footnote that one is coming).
export const HOLIDAY_STATUSES = ["Mandatory", "Floating", "Not Applicable", "Public"] as const;
export type HolidayStatus = (typeof HOLIDAY_STATUSES)[number];

export type Holiday = {
  id: number;
  occasion: string;
  date: string | null; // null when tbc
  region: Region;
  location: string | null; // India only, e.g. "Bangalore"
  status_at_location: HolidayStatus;
  post_trigger: boolean;
  is_weekend: boolean; // informational only — per team decision, weekend
  // holidays still fire a post-trigger suggestion when post_trigger is true.
  tbc: boolean;
  source: "upload" | "manual";
  created_at: string;
};

export type RegulatoryDate = {
  id: number;
  occasion: string;
  date: string; // recurring annually; stored as this year's instance
  region: Region;
  service_line: string;
  product: string | null;
  notes: string | null;
};

export type BacklogItem = {
  id: number;
  title: string;
  description: string | null;
  tags: string[];
  used_in_post_ids: number[];
  created_at: string;
};

export type Comment = {
  id: number;
  post_id: number;
  author: string;
  body: string;
  created_at: string;
};

export type RecurringRule = {
  id: number;
  content_type: string;
  cadence: "Monthly" | "Quarterly" | "Ad hoc";
  target_day_rule: string | null;
  finalize_by_rule: string | null;
  region: Region | "Global/regional specific";
  gap_fill_interval_days: number; // default 15, configurable per type
  last_post_date: string | null;
};

// Work Tracker task — now stored locally (previously proxied to a separate
// work-tracker-drab.vercel.app app, which has since been retired). Field
// names/shapes match exactly what workspace.html's Work Tracker UI already
// sends and expects, so no frontend changes were needed.
export type WorkTask = {
  id: number;
  task_date: string | null;
  task: string;
  category: string | null;
  poc: string | null;
  due_date: string | null;
  assigned_to: string | null; // "/"-joined list of teammate names
  priority: string; // "High" | "Medium" | "Low"
  notes: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};
export type WorkTaskInput = Partial<Omit<WorkTask, "id" | "created_at" | "updated_at" | "archived_at">>;
