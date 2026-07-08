(function seedSubCheckData() {
  function isoFromToday(days) {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }

  window.SubCheckSeed = {
    preferences: {
      renewalWindowHours: 72,
      annualWarningDays: 14,
      highCostThreshold: 25,
      currency: "USD"
    },
    categories: {
      streaming: {
        label: "Streaming & Entertainment",
        shortLabel: "Streaming",
        color: "#10b981",
        softColor: "#d1fae5"
      },
      productivity: {
        label: "SaaS & Productivity",
        shortLabel: "SaaS",
        color: "#3b82f6",
        softColor: "#dbeafe"
      },
      wellness: {
        label: "Health & Wellness",
        shortLabel: "Wellness",
        color: "#f59e0b",
        softColor: "#fef3c7"
      },
      storage: {
        label: "Cloud Storage",
        shortLabel: "Storage",
        color: "#8b5cf6",
        softColor: "#ede9fe"
      },
      utilities: {
        label: "Utilities",
        shortLabel: "Utilities",
        color: "#14b8a6",
        softColor: "#ccfbf1"
      },
      unused: {
        label: "Forgotten/Unused",
        shortLabel: "Unused",
        color: "#ef4444",
        softColor: "#fee2e2"
      }
    },
    subscriptions: [
      {
        id: "sub-spotify",
        name: "Spotify",
        merchantName: "Spotify USA",
        category: "streaming",
        price: 10.99,
        interval: "monthly",
        nextBillDate: isoFromToday(2),
        trialEndsAt: "",
        status: "active",
        usageStatus: "active",
        isEssential: true,
        managementUrl: "https://www.spotify.com/account/subscription/",
        notes: "Daily music subscription."
      },
      {
        id: "sub-netflix",
        name: "Netflix",
        merchantName: "Netflix",
        category: "streaming",
        price: 15.49,
        interval: "monthly",
        nextBillDate: isoFromToday(11),
        trialEndsAt: "",
        status: "active",
        usageStatus: "occasional",
        isEssential: false,
        managementUrl: "https://www.netflix.com/youraccount",
        notes: "Used a few times per month."
      },
      {
        id: "sub-hulu",
        name: "Hulu",
        merchantName: "Hulu",
        category: "streaming",
        price: 17.99,
        interval: "monthly",
        nextBillDate: isoFromToday(21),
        trialEndsAt: "",
        status: "active",
        usageStatus: "unused",
        isEssential: false,
        managementUrl: "https://secure.hulu.com/account",
        notes: "Forgotten streaming plan."
      },
      {
        id: "sub-microsoft-365",
        name: "Microsoft 365",
        merchantName: "Microsoft",
        category: "productivity",
        price: 99.99,
        interval: "annual",
        nextBillDate: isoFromToday(13),
        trialEndsAt: "",
        status: "active",
        usageStatus: "active",
        isEssential: true,
        managementUrl: "https://account.microsoft.com/services",
        notes: "Annual productivity suite renewal."
      },
      {
        id: "sub-google-one",
        name: "Google One",
        merchantName: "Google",
        category: "storage",
        price: 9.99,
        interval: "monthly",
        nextBillDate: isoFromToday(5),
        trialEndsAt: "",
        status: "active",
        usageStatus: "occasional",
        isEssential: false,
        managementUrl: "https://one.google.com/settings",
        notes: "Storage overlap with Microsoft 365."
      },
      {
        id: "sub-calm",
        name: "Calm",
        merchantName: "Calm",
        category: "wellness",
        price: 69.99,
        interval: "annual",
        nextBillDate: isoFromToday(42),
        trialEndsAt: "",
        status: "active",
        usageStatus: "unused",
        isEssential: false,
        managementUrl: "https://www.calm.com/",
        notes: "Annual wellness app."
      },
      {
        id: "sub-dropbox",
        name: "Dropbox",
        merchantName: "Dropbox",
        category: "storage",
        price: 11.99,
        interval: "monthly",
        nextBillDate: isoFromToday(8),
        trialEndsAt: "",
        status: "active",
        usageStatus: "unknown",
        isEssential: false,
        managementUrl: "https://www.dropbox.com/account/plan",
        notes: "Possible storage duplication."
      },
      {
        id: "sub-figma",
        name: "Figma Professional",
        merchantName: "Figma",
        category: "productivity",
        price: 12,
        interval: "monthly",
        nextBillDate: isoFromToday(1),
        trialEndsAt: isoFromToday(1),
        status: "trial",
        usageStatus: "unknown",
        isEssential: false,
        managementUrl: "https://www.figma.com/files/team",
        notes: "Trial needs review before conversion."
      }
    ]
  };
})();

