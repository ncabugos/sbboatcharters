// Per-experience copy for the abandoned-checkout email (lib/email.js).
// Keyed by tours.slug. Edit freely: this file is the only place the words live.
//
// Keep claims to what the experience pages already say. This copy is sent
// year-round, so nothing here should describe "right now" conditions that
// could be false the week it goes out. Lobster reads its season end from the
// database for the same reason.

const DEFAULT = {
  subject: () => 'Don\'t miss out on your trip',
  headline: () => 'Don\'t miss out',
  pitch: () => 'A private boat, just your group, and the Santa Barbara Channel.',
};

const COPY = {
  'sport-fishing': {
    subject: () => 'Don\'t miss out on these epic conditions!',
    headline: () => 'Don\'t miss out on these epic conditions',
    pitch: () =>
      'Calico bass, yellowtail, white seabass and halibut all live in the Santa Barbara Channel. ' +
      'Premium tackle is on board, and with a private boat your group fishes where they\'re biting.',
  },
  spearfishing: {
    subject: () => 'Don\'t miss out on these epic conditions!',
    headline: () => 'Don\'t miss out on these epic conditions',
    pitch: () =>
      'Sea bass, yellowtail and tuna, on spots around the Channel Islands that Captain Garrick ' +
      'has been diving for 16+ years.',
  },
  'lobster-diving': {
    subject: ({ seasonEnd }) =>
      seasonEnd ? `Lobster season ends ${seasonEnd}. Don't miss it!` : 'Don\'t miss lobster season!',
    headline: () => 'Don\'t miss lobster season',
    pitch: ({ seasonEnd }) =>
      `Spiny lobster season${seasonEnd ? ` runs through ${seasonEnd}` : ' only comes once a year'}. ` +
      'Eight hours on the bugs, by day or after dark, with up to 4 divers.',
  },
  'full-day-island-cruise': {
    subject: () => 'Santa Cruz Island is waiting for you',
    headline: () => 'Don\'t miss the islands',
    pitch: () =>
      'Snorkeling, sea caves, marine wildlife and beach time at Santa Cruz Island, on a private boat ' +
      'for up to 6.',
  },
  'coastal-sunset-cruise': {
    subject: () => 'Don\'t miss this sunset',
    headline: () => 'Don\'t miss this sunset',
    pitch: () => 'Santa Barbara\'s best view is from the water, and this one is just for your group.',
  },
  'whale-watching': {
    subject: () => 'Don\'t miss the whales',
    headline: () => 'Don\'t miss the whales',
    pitch: () => 'A private whale watching cruise on the Santa Barbara Channel, just your group on board.',
  },
  foiling: {
    subject: () => 'Ready to fly above the water?',
    headline: () => 'Don\'t miss your chance to fly',
    pitch: () => 'Private foiling lessons off the Santa Barbara coast, for every skill level.',
  },
};

function formatSeasonEnd(dateStr) {
  if (!dateStr) return null;
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', timeZone: 'UTC',
  });
}

export function abandonedCheckoutCopy(b) {
  const copy = COPY[b.tour_slug] || DEFAULT;
  const ctx = { seasonEnd: formatSeasonEnd(b.season_end) };
  return {
    subject: copy.subject(ctx),
    headline: copy.headline(ctx),
    pitch: copy.pitch(ctx),
  };
}
