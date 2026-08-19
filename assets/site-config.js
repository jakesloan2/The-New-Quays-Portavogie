/* ============================================================
   SITE CONFIG — single source of truth
   ------------------------------------------------------------
   Edit this file to change business details across the whole
   site. The header, footer, contact page, booking buttons and
   "open now" indicators all read from here.

   IMPORTANT: values wrapped in [SQUARE BRACKETS] are placeholders
   that still need the client's confirmed information. Search the
   project for "[" to find them all.

   NOTE ON SEO: the same details are also hard-coded into each
   page's HTML and JSON-LD so that search engines and AI crawlers
   see them without running JavaScript. If you change something
   here, change it in the HTML too. The README lists where.
   ============================================================ */

window.SITE = {

  /* ---- Identity ---- */
  name: "The New Quays",
  fullName: "The New Quays, Portavogie",
  legalAlt: ["The Quays", "New Quays Portavogie"],

  /* ---- Contact ---- */
  phone: {
    display: "028 4277 2225",
    // E.164 format for tel: links — works from any country
    tel: "+442842772225"
  },
  email: "[EMAIL ADDRESS]",
  address: {
    street: "81 New Harbour Road",
    locality: "Portavogie",
    region: "County Down",
    postcode: "BT22 1EB",
    country: "Northern Ireland",
    // Approximate — replace with the exact pin from Google Business Profile
    lat: "[LATITUDE]",
    lng: "[LONGITUDE]"
  },

  /* ---- Social ---- */
  social: {
    facebook: "[FACEBOOK URL]",
    instagram: "[INSTAGRAM URL]",
    tripadvisor: "[TRIPADVISOR URL]"
  },

  /* ============================================================
     BOOKING COMPONENT
     ------------------------------------------------------------
     mode: "phone"  -> every Book a Table button becomes a tel: link
                       on touch devices, and opens a details panel
                       on desktop (where tel: does nothing useful).
     mode: "widget" -> every button opens the provider's booking
                       widget instead. Set widgetUrl and switch
                       mode. No other file needs to change.

     This is the whole migration path to ResDiary / Dojo /
     OpenTable / SevenRooms. One value.
     ============================================================ */
  booking: {
    mode: "phone",
    widgetUrl: "",              // e.g. "https://booking.resdiary.com/widget/..."
    largePartyThreshold: 8,
    note: "For parties of 8 or more, please call and we'll look after you."
  },

  /* ============================================================
     OPENING HOURS
     ------------------------------------------------------------
     Two separate schedules: the restaurant and Besties Café run
     different days and different times, but share one phone line.
     Each "open status" indicator on the site is told which venue
     it belongs to.

     Format: 24h "HH:MM". Multiple sittings per day are allowed.
     An empty array means closed that day.
     0 = Sunday ... 6 = Saturday
     ============================================================ */
  hours: {

    // TODO: CONFIRM WITH CLIENT.
    // Public listings disagree on the restaurant's hours, so these
    // are deliberately left empty rather than guessed. Until they
    // are filled in, the site shows "[OPENING HOURS]" and the
    // open/closed indicator stays hidden.
    restaurant: {
      label: "Restaurant",
      confirmed: false,
      days: {
        0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
      }
    },

    // Confirmed from the venue's own Google Business Profile.
    besties: {
      label: "Besties Café",
      confirmed: true,
      days: {
        0: [["10:00", "12:00"]],   // Sunday
        1: [],                     // Monday    — closed
        2: [],                     // Tuesday   — closed
        3: [],                     // Wednesday — closed
        4: [["10:00", "15:00"]],   // Thursday
        5: [["10:00", "15:00"]],   // Friday
        6: [["10:00", "15:00"]]    // Saturday
      }
    }
  }
};
