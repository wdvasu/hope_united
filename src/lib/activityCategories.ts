export const ACTIVITY_CATEGORIES = [
  'Wellness',
  'Recovery Meeting',
  'Drop-In',
  'Veteran Programming',
  'Social Event',
  'Volunteer',
  'Peer Support',
  'Family Support',
  'Art',
  'Training/Focus Group',
  'Tour/Outreach',
  'Faith-Based',
  'Personal Growth',
  'Event',
  'Board Meeting',
  'Bus Pass',
  'Virtual Reality',
  'The Retreat Virtual Reality',
] as const;

export type ActivityCategory = typeof ACTIVITY_CATEGORIES[number];
