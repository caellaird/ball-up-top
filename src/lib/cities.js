// Curated list of real US cities so a player's home city is always a known,
// consistently-keyed place. The key matches the server-side normalizeCity()
// output ("durham, nc"), so profile cities and leaderboard rows line up.
const RAW = {
  AL: 'Birmingham|Montgomery|Mobile|Huntsville|Tuscaloosa|Auburn|Dothan|Decatur',
  AK: 'Anchorage|Fairbanks|Juneau|Wasilla|Sitka|Ketchikan',
  AZ: 'Phoenix|Tucson|Mesa|Scottsdale|Chandler|Tempe|Gilbert|Glendale|Flagstaff',
  AR: 'Little Rock|Fort Smith|Fayetteville|Springdale|Jonesboro|Rogers|Conway',
  CA: 'Los Angeles|San Diego|San Jose|San Francisco|Fresno|Sacramento|Long Beach|Oakland|Bakersfield|Anaheim|Santa Ana|Riverside|Stockton|Irvine|San Bernardino|Modesto',
  CO: 'Denver|Colorado Springs|Aurora|Fort Collins|Lakewood|Boulder|Pueblo|Greeley',
  CT: 'Bridgeport|New Haven|Stamford|Hartford|Waterbury|Norwalk|Danbury',
  DE: 'Wilmington|Dover|Newark|Middletown|Smyrna',
  DC: 'Washington',
  FL: 'Jacksonville|Miami|Tampa|Orlando|St. Petersburg|Hialeah|Tallahassee|Fort Lauderdale|Gainesville|Sarasota|Naples|Pensacola|Clearwater',
  GA: 'Atlanta|Columbus|Augusta|Savannah|Athens|Macon|Roswell|Albany',
  HI: 'Honolulu|Hilo|Kailua|Kapolei|Lahaina',
  ID: 'Boise|Meridian|Nampa|Idaho Falls|Pocatello|Coeur d Alene',
  IL: 'Chicago|Aurora|Naperville|Joliet|Rockford|Springfield|Peoria|Champaign|Evanston',
  IN: 'Indianapolis|Fort Wayne|Evansville|South Bend|Carmel|Bloomington|Fishers|Lafayette',
  IA: 'Des Moines|Cedar Rapids|Davenport|Sioux City|Iowa City|Ames|Waterloo',
  KS: 'Wichita|Overland Park|Kansas City|Topeka|Olathe|Lawrence|Manhattan',
  KY: 'Louisville|Lexington|Bowling Green|Owensboro|Covington|Frankfort',
  LA: 'New Orleans|Baton Rouge|Shreveport|Lafayette|Lake Charles|Metairie|Bossier City',
  ME: 'Portland|Lewiston|Bangor|South Portland|Auburn|Augusta',
  MD: 'Baltimore|Frederick|Rockville|Gaithersburg|Annapolis|Silver Spring|Bethesda',
  MA: 'Boston|Worcester|Springfield|Cambridge|Lowell|Brockton|Quincy|New Bedford',
  MI: 'Detroit|Grand Rapids|Warren|Sterling Heights|Ann Arbor|Lansing|Flint|Dearborn',
  MN: 'Minneapolis|St. Paul|Rochester|Duluth|Bloomington|Brooklyn Park|St. Cloud',
  MS: 'Jackson|Gulfport|Hattiesburg|Biloxi|Southaven|Tupelo|Meridian',
  MO: 'Kansas City|St. Louis|Springfield|Columbia|Independence|Lees Summit|Jefferson City',
  MT: 'Billings|Missoula|Great Falls|Bozeman|Helena|Butte',
  NE: 'Omaha|Lincoln|Bellevue|Grand Island|Kearney|Fremont',
  NV: 'Las Vegas|Henderson|Reno|North Las Vegas|Sparks|Carson City',
  NH: 'Manchester|Nashua|Concord|Dover|Rochester|Keene',
  NJ: 'Newark|Jersey City|Paterson|Elizabeth|Edison|Trenton|Camden|Atlantic City',
  NM: 'Albuquerque|Las Cruces|Rio Rancho|Santa Fe|Roswell|Farmington',
  NY: 'New York|Brooklyn|Queens|Manhattan|Bronx|Buffalo|Rochester|Yonkers|Syracuse|Albany|New Rochelle',
  NC: 'Charlotte|Raleigh|Greensboro|Durham|Winston-Salem|Fayetteville|Cary|Wilmington|Chapel Hill|Asheville',
  ND: 'Fargo|Bismarck|Grand Forks|Minot|Williston',
  OH: 'Columbus|Cleveland|Cincinnati|Toledo|Akron|Dayton|Parma|Canton',
  OK: 'Oklahoma City|Tulsa|Norman|Broken Arrow|Edmond|Lawton',
  OR: 'Portland|Salem|Eugene|Gresham|Hillsboro|Bend|Beaverton',
  PA: 'Philadelphia|Pittsburgh|Allentown|Erie|Reading|Scranton|Bethlehem|Harrisburg',
  RI: 'Providence|Warwick|Cranston|Pawtucket|Woonsocket|Newport',
  SC: 'Charleston|Columbia|North Charleston|Greenville|Rock Hill|Mount Pleasant|Spartanburg',
  SD: 'Sioux Falls|Rapid City|Aberdeen|Brookings|Watertown',
  TN: 'Nashville|Memphis|Knoxville|Chattanooga|Clarksville|Murfreesboro|Franklin',
  TX: 'Houston|San Antonio|Dallas|Austin|Fort Worth|El Paso|Arlington|Corpus Christi|Plano|Laredo|Lubbock|Frisco|Amarillo|McKinney|Waco',
  UT: 'Salt Lake City|West Valley City|Provo|West Jordan|Orem|Sandy|Ogden|St. George',
  VT: 'Burlington|South Burlington|Rutland|Barre|Montpelier',
  VA: 'Virginia Beach|Norfolk|Chesapeake|Richmond|Newport News|Alexandria|Hampton|Arlington|Roanoke',
  WA: 'Seattle|Spokane|Tacoma|Vancouver|Bellevue|Kent|Everett|Renton|Olympia',
  WV: 'Charleston|Huntington|Morgantown|Parkersburg|Wheeling',
  WI: 'Milwaukee|Madison|Green Bay|Kenosha|Racine|Appleton|Eau Claire',
  WY: 'Cheyenne|Casper|Laramie|Gillette|Rock Springs',
};

export const US_CITIES = Object.entries(RAW).flatMap(([state, names]) =>
  names.split('|').map((city) => ({
    city,
    state,
    label: `${city}, ${state}`,
    key: `${city.toLowerCase()}, ${state.toLowerCase()}`,
  }))
);

const BY_LABEL = new Map(US_CITIES.map((c) => [c.label.toLowerCase(), c]));

const POPULAR_LABELS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Dallas, TX',
  'Atlanta, GA', 'Miami, FL', 'Philadelphia, PA', 'Phoenix, AZ', 'Charlotte, NC',
  'Washington, DC', 'Detroit, MI', 'Boston, MA', 'Seattle, WA', 'Denver, CO',
  'Las Vegas, NV', 'Brooklyn, NY', 'Oakland, CA', 'Memphis, TN', 'Nashville, TN',
  'Raleigh, NC', 'Durham, NC', 'San Antonio, TX', 'Austin, TX', ' Columbus, OH',
];

export const POPULAR_CITIES = POPULAR_LABELS
  .map((label) => BY_LABEL.get(label.trim().toLowerCase()))
  .filter(Boolean);

// Search across city + state labels; popular cities shown before any query.
export function searchCities(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return POPULAR_CITIES;

  const starts = [];
  const contains = [];
  for (const c of US_CITIES) {
    const label = c.label.toLowerCase();
    if (label.startsWith(q)) starts.push(c);
    else if (label.includes(q)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, 40);
}

// Resolves any stored city string into a canonical { city, key, display } trio.
// Known cities come from the dataset; anything else is normalized the same way
// the server does, so older free-text profiles still score consistently.
export function toCityAttribution(raw) {
  const trimmed = (raw || '').trim();
  if (!trimmed) return { city: '', key: '', display: '' };

  const known = BY_LABEL.get(trimmed.toLowerCase());
  if (known) return { city: known.label, key: known.key, display: known.label };

  const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  const city = parts[0] || trimmed;
  const state = parts[1] || '';
  const key = state ? `${city.toLowerCase()}, ${state.toLowerCase()}` : city.toLowerCase();
  const display = state
    ? `${city.charAt(0).toUpperCase() + city.slice(1).toLowerCase()}, ${state.toUpperCase()}`
    : city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  return { city: display, key, display };
}