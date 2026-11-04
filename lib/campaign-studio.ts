export type CampaignStage = 'coming_soon' | 'launching' | 'live' | 'growth';

export type FlyerTemplate = {
  id: string;
  number: number;
  name: string;
  category: 'launch' | 'order' | 'offer' | 'vendor' | 'recruit' | 'guide' | 'print';
  eyebrow: string;
  headline: (campusName: string, abbreviation: string, stage: CampaignStage) => string;
  supporting: (campusName: string, abbreviation: string, stage: CampaignStage) => string;
  cta: string;
  image: string;
  family: number;
};

const stageHeadline = (abbreviation: string, stage: CampaignStage) => {
  if (stage === 'coming_soon') return `${abbreviation}, GET READY.`;
  if (stage === 'launching') return `${abbreviation}, WE'RE LIVE TODAY.`;
  if (stage === 'live') return `${abbreviation}, YOUR NEXT MEAL IS HERE.`;
  return `GOOD FOOD MOVES FAST AT ${abbreviation}.`;
};

const stageSupport = (campusName: string, stage: CampaignStage) => {
  if (stage === 'coming_soon') return `A better way to discover food is arriving at ${campusName}.`;
  if (stage === 'launching') return `Open Meal Direct, choose a vendor, and get food moving across campus.`;
  if (stage === 'live') return `Discover vendors serving ${campusName} today.`;
  return `Good food, direct from campus vendors to your day.`;
};

const definition = (
  number: number,
  name: string,
  category: FlyerTemplate['category'],
  eyebrow: string,
  headline: FlyerTemplate['headline'],
  supporting: FlyerTemplate['supporting'],
  cta: string,
  image: string,
  family: number,
): FlyerTemplate => ({ number, id: `${String(number).padStart(2, '0')}_${name.toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`, name, category, eyebrow, headline, supporting, cta, image, family });

/**
 * The studio intentionally keeps a broad campaign pack rather than one repeated
 * layout. A campus team can use the formats as a launch sequence, then pull a
 * focused creative as needed without inventing unverified offers or claims.
 */
export const FLYER_TEMPLATES: FlyerTemplate[] = [
  definition(1, 'Campus launch', 'launch', 'OFFICIAL CAMPUS DROP', (name, abbr, stage) => stageHeadline(abbr, stage), (name, _abbr, stage) => stageSupport(name, stage), 'SCAN TO EXPLORE', '/campaign/jollof.jpg', 1),
  definition(2, 'Coming soon', 'launch', 'SAVE THE DATE', (_name, abbr) => `${abbr}, SOMETHING GOOD IS COMING.`, (name) => `Meal Direct is preparing to land at ${name}.`, 'STAY IN THE LOOP', '/campaign/suya.jpg', 2),
  definition(3, 'Order now', 'order', 'MEAL DIRECT / ON CAMPUS', (_name, abbr) => `ORDER SMARTER, ${abbr}.`, (name) => `Your next meal from ${name} vendors is a few taps away.`, 'ORDER NOW', '/campaign/jollof.jpg', 3),
  definition(4, 'Campus awareness', 'launch', 'THE CAMPUS FOOD COMPANION', () => 'GOOD FOOD. RIGHT WHERE YOU ARE.', (name) => `Meet the easier way to discover meals around ${name}.`, 'FIND YOUR MEAL', '/campaign/lifestyle.jpg', 4),
  definition(5, 'First order', 'offer', 'FIRST ORDER', () => 'START WITH SOMETHING DELICIOUS.', (name) => `Explore Meal Direct at ${name}. Add a verified offer only when one is live.`, 'START EXPLORING', '/campaign/egusi.jpg', 5),
  definition(6, 'Referral', 'offer', 'PASS IT ON', (_name, abbr) => `GOOD FOOD IS BETTER SHARED, ${abbr}.`, (name) => `Send your campus food link to a friend at ${name}.`, 'SHARE THE LINK', '/campaign/lifestyle.jpg', 6),
  definition(7, 'Student value', 'offer', 'THE STUDENT FOOD EDIT', () => 'YOUR CAMPUS. YOUR BUDGET. YOUR CHOICE.', (name) => `Browse the meals available around ${name} before the next lecture.`, 'BROWSE MEALS', '/campaign/jollof.jpg', 7),
  definition(8, 'Cravings', 'order', 'CRAVING CLUB', () => 'WHAT ARE YOU EATING TODAY?', (name) => `Discover flavours from vendors serving ${name}.`, 'EXPLORE VENDORS', '/campaign/egusi.jpg', 8),
  definition(9, 'Campus routine', 'order', 'LECTURES / STUDY / LATE NIGHT', () => 'KEEP THE DAY MOVING.', (name) => `From busy days to late sessions, Meal Direct is built for ${name}.`, 'ORDER ON CAMPUS', '/campaign/suya.jpg', 9),
  definition(10, 'Vendor recruitment', 'vendor', 'FOR FOOD BUSINESSES', () => 'YOUR FOOD DESERVES MORE STUDENTS.', (name) => `Bring your menu to the people looking for it at ${name}.`, 'PARTNER WITH US', '/campaign/suya.jpg', 10),
  definition(11, 'Vendor spotlight', 'vendor', 'THE PEOPLE WHO FEED CAMPUS', () => 'FRESHLY MADE. CAMPUS READY.', (name) => `Highlight a verified vendor serving ${name}.`, 'MEET THE VENDOR', '/campaign/lifestyle.jpg', 11),
  definition(12, 'Menu drop', 'vendor', "TODAY'S MENU", () => 'THE PLATE LIST.', (name) => `Show today’s real selections from a ${name} vendor.`, 'VIEW THE MENU', '/campaign/egusi.jpg', 12),
  definition(13, 'Vendor benefits', 'vendor', 'MORE REACH. LESS FRICTION.', () => 'LET MORE STUDENTS FIND YOUR FOOD.', (name) => `Digital ordering and campus visibility for vendors at ${name}.`, 'BECOME A PARTNER', '/campaign/suya.jpg', 13),
  definition(14, 'Campus ambassador', 'recruit', 'CAMPUS LEADERS WANTED', (_name, abbr) => `BE THE FOOD PLUG AT ${abbr}.`, (name) => `Help introduce a better food experience at ${name}.`, 'APPLY TO REPRESENT', '/campaign/lifestyle.jpg', 14),
  definition(15, 'Student representative', 'recruit', 'COMMUNITY PARTNER', () => 'TURN YOUR CAMPUS NETWORK INTO IMPACT.', (name) => `Build campus energy for Meal Direct at ${name}.`, 'JOIN THE TEAM', '/campaign/lifestyle.jpg', 15),
  definition(16, 'Delivery partner', 'recruit', 'KEEP CAMPUS MOVING', () => 'HELP DELIVER GOOD FOOD.', (name) => `Recruit delivery partners for verified orders at ${name}.`, 'JOIN DELIVERY', '/campaign/campus_student_food_lifestyle_1792934452674.jpg', 16),
  definition(17, 'How to order', 'guide', 'FOUR EASY MOVES', () => 'SCAN. CHOOSE. ORDER. EAT.', (name) => `A clear first-order guide for students at ${name}.`, 'START YOUR ORDER', '/campaign/jollof.jpg', 17),
  definition(18, 'How it works', 'guide', 'THE SIMPLE VERSION', () => 'PICK A MEAL. WE HANDLE THE REST.', (name) => `Explain the real ordering and delivery flow for ${name}.`, 'SEE HOW IT WORKS', '/campaign/egusi.jpg', 18),
  definition(19, 'Student voice', 'offer', 'CAMPUS VOICES', () => 'REAL STUDENTS. REAL MEALS.', (name) => `Add a genuine student quote from ${name}; never manufacture testimonials.`, 'EXPLORE MEAL DIRECT', '/campaign/lifestyle.jpg', 19),
  definition(20, 'Weekly pick', 'order', 'THIS WEEK ON CAMPUS', () => 'MAKE TODAY’S MEAL COUNT.', (name) => `Feature a real available meal or vendor at ${name}.`, 'SEE WHAT’S AVAILABLE', '/campaign/jollof.jpg', 20),
  definition(21, 'Noticeboard', 'print', 'CAMPUS NOTICE', () => 'A BETTER LUNCH BREAK STARTS HERE.', (name) => `Print-ready noticeboard creative for ${name}.`, 'SCAN TO ORDER', '/campaign/suya.jpg', 21),
  definition(22, 'Hostel poster', 'print', 'ROOM TO PLATE', () => 'YOUR HOSTEL. YOUR MEAL.', (name) => `Place this at approved ${name} hostel locations.`, 'SCAN TO EXPLORE', '/campaign/egusi.jpg', 22),
  definition(23, 'Counter QR', 'print', 'ONE SCAN. NO QUEUE.', () => 'FOOD MOVES FASTER WITH MEAL DIRECT.', (name) => `A compact QR flyer for participating ${name} vendors.`, 'SCAN TO ORDER', '/campaign/jollof.jpg', 23),
  definition(24, 'Launch event', 'launch', 'CAMPUS, YOU ARE INVITED', () => 'THE MEAL DIRECT LAUNCH DAY.', (name) => `Add confirmed launch-event details for ${name}.`, 'GET READY', '/campaign/lifestyle.jpg', 24),
  definition(25, 'Food challenge', 'offer', 'CAMPUS FOOD FIGHT', () => 'TEAM JOLLOF OR TEAM SWALLOW?', (name) => `A conversation starter for the ${name} community.`, 'PICK YOUR SIDE', '/campaign/jollof.jpg', 25),
  definition(26, 'Campus partner', 'vendor', 'BETTER TOGETHER', () => 'MEAL DIRECT × CAMPUS COMMUNITY.', (name) => `Introduce a verified partner collaboration at ${name}.`, 'DISCOVER MORE', '/campaign/lifestyle.jpg', 26),
  definition(27, 'Pocket flyer', 'print', 'CAMPUS FOOD, UNLOCKED', () => 'YOUR NEXT MEAL IS A SCAN AWAY.', (name) => `A compact handout for ${name} activations.`, 'SCAN TO START', '/campaign/jollof.jpg', 27),
  definition(28, 'Packaging insert', 'print', 'PACKED WITH CARE', () => 'THERE IS MORE TO DISCOVER.', (name) => `An insert for Meal Direct orders around ${name}.`, 'DISCOVER YOUR NEXT MEAL', '/campaign/egusi.jpg', 28),
];

export const abbreviateCampus = (name: string) => {
  const initials = name.match(/\b[A-Za-z0-9]/g)?.join('').toUpperCase() ?? '';
  return initials.length >= 2 && initials.length <= 8 ? initials : name.slice(0, 6).toUpperCase();
};

export const campaignDestination = (slug?: string) => `https://user.mealdirectly.com/${encodeURIComponent(slug || '')}`;
