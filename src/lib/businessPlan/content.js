import { BUSINESS_SECTIONS } from './contentBusiness.js';
import { PRODUCT_SECTIONS } from './contentProduct.js';
import { TECHNICAL_SECTIONS } from './contentTechnical.js';

export const PLAN_META = {
  title: 'Ball Up Top',
  subtitle: 'Business Plan and Product Reference',
  tagline: 'Competitive record for pickup sport, one city at a time.',
  version: 'Edition 1',
  preparedFor: 'Founders, partners and investors',
  confidential: 'Confidential. Contains product and business information not intended for public distribution.',
  site: 'theballuptop.com',
};

// Part headings are inserted as their own divider sections so the table of
// contents reads as three parts plus an appendix.
const PART_BUSINESS = {
  id: 'part-business',
  part: true,
  title: 'Part One: The Business',
  intro: 'Why the product exists, who it serves, how it competes and what it is trying to achieve.',
  blocks: [],
};

const PART_PRODUCT = {
  id: 'part-product',
  part: true,
  title: 'Part Two: The Product',
  intro: 'Every surface a player can reach, what each tab and option does, and why it exists.',
  blocks: [],
};

const PART_TECH = {
  id: 'part-technical',
  part: true,
  title: 'Part Three: How It Works',
  intro: 'The data model, the services behind the screens, and the rules that keep records and rankings consistent.',
  blocks: [],
};

export const SNAPSHOT_SECTION = {
  id: 'snapshot',
  title: 'Appendix: Live Record Snapshot',
  dynamic: true,
  blocks: [],
};

export const PLAN_SECTIONS = [
  PART_BUSINESS,
  ...BUSINESS_SECTIONS,
  PART_PRODUCT,
  ...PRODUCT_SECTIONS,
  PART_TECH,
  ...TECHNICAL_SECTIONS,
  SNAPSHOT_SECTION,
];

export function getPlanSections(snapshot) {
  return PLAN_SECTIONS.map((section) => {
    if (section.id !== 'snapshot') return section;
    return { ...section, blocks: snapshotBlocks(snapshot) };
  });
}

function snapshotBlocks(snapshot) {
  if (!snapshot || !snapshot.rows?.length) {
    return [
      {
        t: 'p',
        text: 'A live snapshot of stored records was not available when this document was generated. Open the business plan screen while signed in and download again to include current counts.',
      },
    ];
  }

  return [
    {
      t: 'p',
      text: `Counts of stored records at the moment this document was generated (${snapshot.generatedAt}). These are record counts visible to the generating account, not active-user figures.`,
    },
    {
      t: 'table',
      head: ['Record', 'Count'],
      widths: [0.6, 0.4],
      rows: snapshot.rows.map((r) => [r.label, r.value]),
    },
    {
      t: 'callout',
      label: 'How to read this',
      text: 'A record count measures activity volume, not people. Use the analytics events described in the Measurement section for players and sessions.',
    },
  ];
}