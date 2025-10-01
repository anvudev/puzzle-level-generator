/**
 * Changelog types for version updates
 */

export type ChangelogType = "feature" | "bugfix" | "release" | "improvement";

export interface ChangelogItem {
  version: string;
  date: string;
  title: string;
  type: ChangelogType;
  items: string[];
}

export interface ChangelogData {
  version: string;
  lastUpdate: string;
  updates: ChangelogItem[];
}
