import events from './events.json';

// The catalog includes coordinates for some public venues. For everything else,
// use approximate neighborhood centers; private/TBA San Francisco venues are
// not assigned a map position.
const areaCenters = {
  'Alameda (USS Hornet)': [37.7735, -122.3022],
  Alameda: [37.774, -122.275],
  'Ballbach and SOFA': [37.328, -121.888],
  'Belden Place': [37.7911, -122.4035],
  Berkeley: [37.8715, -122.273],
  'Burlingame (near SFO)': [37.5800, -122.3450],
  Burlingame: [37.5800, -122.3450],
  'Cathedral Hill': [37.785, -122.424],
  'Central Waterfront': [37.7519, -122.3868],
  'Charleston Terrace': [37.402, -122.086],
  'Civic Center': [37.7786, -122.4193],
  Dogpatch: [37.7580, -122.3880],
  'Downtown San Jose': [37.3337, -121.8890],
  'Duboce Triangle': [37.768, -122.431],
  Embarcadero: [37.7934, -122.3931],
  'Financial District': [37.7938, -122.3984],
  'Fort Mason': [37.8075, -122.4314],
  'Hayes Valley': [37.7764, -122.4242],
  'Jackson Square': [37.796, -122.402],
  Japantown: [37.7853, -122.4295],
  Marina: [37.8024, -122.4360],
  'Marina District': [37.8016, -122.4384],
  'Menlo Park': [37.4530, -122.1817],
  'Mission District': [37.7599, -122.4148],
  'Mountain View': [37.392, -122.084],
  'North Beach': [37.7994, -122.4090],
  'Northern Waterfront': [37.807, -122.412],
  'Palo Alto': [37.443, -122.164],
  'Polk Gulch': [37.791, -122.420],
  'Rincon Hill': [37.7862, -122.3938],
  'Russian Hill': [37.8011, -122.4192],
  'San Jose': [37.3372, -121.8863],
  'San Pedro and Convention Center': [37.333, -121.890],
  'Santa Clara': [37.354, -121.955],
  SoMa: [37.7779, -122.4057],
  'South Park': [37.780, -122.394],
  'South Beach': [37.7807, -122.3905],
  'South of Market': [37.7779, -122.4057],
  'South of Seminary - Vintage Oaks': [37.466, -122.165],
  Stanford: [37.4275, -122.1697],
  Sunnyvale: [37.3688, -122.0363],
  Tenderloin: [37.7845, -122.4149],
  'Treasure Island': [37.824, -122.371],
  'Transbay / SoMa': [37.7892, -122.3965],
  'Union Square': [37.7879, -122.4074],
  'Union Street': [37.797, -122.430],
  'Yerba Buena': [37.7852, -122.4026],
};

const locatedByArea = new Map();
for (const event of events) {
  if (event.latitude == null || event.longitude == null || event.neighborhood === 'unknown') continue;
  if (!locatedByArea.has(event.neighborhood)) locatedByArea.set(event.neighborhood, []);
  locatedByArea.get(event.neighborhood).push([event.latitude, event.longitude]);
}

function areaCenter(event) {
  if (event.neighborhood === 'unknown') return null;
  const known = locatedByArea.get(event.neighborhood);
  if (known?.length) {
    return [
      known.reduce((sum, point) => sum + point[0], 0) / known.length,
      known.reduce((sum, point) => sum + point[1], 0) / known.length,
    ];
  }
  return areaCenters[event.neighborhood] ?? areaCenters[event.city] ?? null;
}

function basePosition(event) {
  if (event.latitude != null && event.longitude != null) return [event.latitude, event.longitude];
  return areaCenter(event);
}

function displayTime(raw) {
  const match = raw.match(/\b(\d{1,2}):(\d{2})\b/);
  if (!match) return 'Time on event page';
  const hour = Number(match[1]);
  const minute = match[2];
  const hour12 = hour % 12 || 12;
  return `${hour12}${minute === '00' ? '' : `:${minute}`} ${hour < 12 ? 'AM' : 'PM'}`;
}

function dateLabel(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', timeZone: 'UTC',
  }).format(new Date(`${value}T12:00:00Z`));
}

const areaSlots = new Map();
for (const event of events) {
  const center = basePosition(event);
  if (!center) continue;
  const key = `${center[0].toFixed(4)},${center[1].toFixed(4)}`;
  if (!areaSlots.has(key)) areaSlots.set(key, []);
  areaSlots.get(key).push(event.id);
}

function approximatePosition(event, center) {
  if (!center) return null;
  const peers = areaSlots.get(`${center[0].toFixed(4)},${center[1].toFixed(4)}`);
  if (peers.length === 1) return center;
  const index = peers.indexOf(event.id);
  const angle = index * 2.39996;
  const radius = (event.latitude != null ? 0.0013 : 0.0018) * Math.sqrt(index + 0.7);
  return [
    center[0] + Math.sin(angle) * radius,
    center[1] + Math.cos(angle) * radius * 1.27,
  ];
}

export const allEvents = events.map((event) => {
  const endDate = event.time_pt.match(/to (2026-\d\d-\d\d)/)?.[1] ?? event.date;
  const center = basePosition(event);
  return {
    ...event,
    endDate,
    dateText: endDate === event.date
      ? dateLabel(event.date)
      : `${dateLabel(event.date)}–${dateLabel(endDate).split(' ')[1]}`,
    shortTime: displayTime(event.time_pt),
    isFree: /^free\b/i.test(event.cost),
    isOutsideSF: event.city !== 'San Francisco',
    // Separate pins within a neighborhood. These are deliberately approximate,
    // not venue coordinates; unpublished locations stay off the map.
    position: approximatePosition(event, center),
  };
});

export const dates = [...new Set(allEvents.flatMap((event) => {
  const result = [];
  for (let day = new Date(`${event.date}T12:00:00Z`);
    day <= new Date(`${event.endDate}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + 1)) {
    result.push(day.toISOString().slice(0, 10));
  }
  return result;
}))].sort();

export const categories = [...new Set(allEvents.map((event) => event.category))].sort();

export function accessLabel(access) {
  return ({
    'invite-only': 'Invite only',
    approval: 'Approval needed',
    application: 'Apply',
    open: 'Open registration',
    full: 'Full',
  })[access] ?? access;
}

export function categoryLabel(category) {
  if (category === 'vc-social') return 'VC Social';
  return category.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
