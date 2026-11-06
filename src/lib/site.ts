// Live on dashboardsymbolmeanings.com (launched 2026-11-06).
export const SITE_URL = 'https://dashboardsymbolmeanings.com';
export const SITE_NAME = 'Dashboard Symbol Meanings';
// While true: every page is noindex, robots.txt blocks crawlers, and a banner says the site isn't launched.
export const PREVIEW = false;
export const AMAZON_TAG = 'booforgen-20';
export const amazonUrl = (q: string) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(q)}${AMAZON_TAG ? `&tag=${AMAZON_TAG}` : ''}`;
export const KEYFOB_URL = 'https://keyfobbatterysize.com';
export const FUSE_URL = 'https://fuseboxdiagrams.com';
