/** The supplied contact sheet is visual direction; campaign facts remain editable. */
export const CAMPAIGN_REFERENCE_SHEET = '/campaign/reference/contact-sheet.png';
const student = '/campaign/reference/student.png';
const vendor = '/campaign/reference/vendor.png';
const rider = '/campaign/reference/rider.png';

export const CAMPAIGN_ART: Record<number, { image?: string; reference: number; highlight?: boolean }> = {
  1: { image: student, reference: 1, highlight: true },
  2: { image: '/campaign/jollof.jpg', reference: 2 },
  3: { image: '/campaign/jollof.jpg', reference: 3 },
  4: { image: student, reference: 4 },
  5: { image: student, reference: 5 },
  6: { image: '/campaign/lifestyle.jpg', reference: 6 },
  7: { image: '/campaign/jollof.jpg', reference: 7 },
  8: { image: '/campaign/egusi.jpg', reference: 8, highlight: true },
  9: { image: student, reference: 9 },
  10: { image: vendor, reference: 10 },
  11: { image: vendor, reference: 15 },
  12: { image: '/campaign/jollof.jpg', reference: 20 },
  13: { image: vendor, reference: 11 },
  14: { image: student, reference: 12 },
  15: { image: student, reference: 13 },
  16: { image: rider, reference: 14, highlight: true },
  17: { reference: 17, highlight: true },
  18: { reference: 18 },
  19: { reference: 19, highlight: true },
  20: { image: '/campaign/jollof.jpg', reference: 20 },
  21: { image: student, reference: 21, highlight: true },
  22: { image: student, reference: 21 },
  23: { reference: 22 },
  24: { image: '/campaign/lifestyle.jpg', reference: 23 },
  25: { reference: 24 },
  26: { reference: 25 },
  27: { image: '/campaign/jollof.jpg', reference: 27 },
  28: { image: '/campaign/jollof.jpg', reference: 28 },
};

export function referencePosition(number: number) {
  const index = (CAMPAIGN_ART[number]?.reference ?? number) - 1;
  return `${index % 7 / 6 * 100}% ${Math.floor(index / 7) / 3 * 100}%`;
}
