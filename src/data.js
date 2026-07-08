(function seedSubCheckData() {
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
    subscriptions: []
  };
})();
