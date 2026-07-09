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
      shopping: {
        label: "Shopping & Delivery",
        shortLabel: "Shopping",
        color: "#f97316",
        softColor: "#ffedd5"
      },
      unused: {
        label: "Forgotten/Unused",
        shortLabel: "Unused",
        color: "#ef4444",
        softColor: "#fee2e2"
      }
    },
    serviceCatalog: [
      {
        id: "netflix",
        canonicalName: "Netflix",
        aliases: ["netflix"],
        merchantName: "Netflix",
        category: "streaming",
        homepage: "https://www.netflix.com/",
        accessSummary: "Video streaming with movies, series, original shows, and documentaries.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "original-shows"]
      },
      {
        id: "hulu",
        canonicalName: "Hulu",
        aliases: ["hulu"],
        merchantName: "Hulu",
        category: "streaming",
        homepage: "https://www.hulu.com/",
        accessSummary: "Video streaming with TV episodes, movies, originals, and optional live TV.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "live-tv"]
      },
      {
        id: "disney-plus",
        canonicalName: "Disney+",
        aliases: ["disney plus", "disney+", "disney"],
        merchantName: "Disney",
        category: "streaming",
        homepage: "https://www.disneyplus.com/",
        accessSummary: "Video streaming focused on Disney, Pixar, Marvel, Star Wars, National Geographic, and originals.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "family-content", "original-shows"]
      },
      {
        id: "max",
        canonicalName: "Max",
        aliases: ["max", "hbo max"],
        merchantName: "Warner Bros. Discovery",
        category: "streaming",
        homepage: "https://www.max.com/",
        accessSummary: "Video streaming with HBO, movies, series, documentaries, and originals.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "original-shows"]
      },
      {
        id: "prime-video",
        canonicalName: "Prime Video",
        aliases: ["prime video", "amazon prime video"],
        merchantName: "Amazon",
        category: "streaming",
        homepage: "https://www.primevideo.com/",
        accessSummary: "Video streaming with movies, shows, Amazon originals, rentals, and channel add-ons.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "original-shows", "video-rentals"]
      },
      {
        id: "spotify",
        canonicalName: "Spotify",
        aliases: ["spotify", "spotify premium"],
        merchantName: "Spotify",
        category: "streaming",
        homepage: "https://www.spotify.com/",
        accessSummary: "Music, playlists, podcasts, audiobook access in supported plans, offline listening, and ad-free playback.",
        accessTags: ["music-streaming", "podcasts", "offline-listening", "ad-free-audio"]
      },
      {
        id: "apple-music",
        canonicalName: "Apple Music",
        aliases: ["apple music"],
        merchantName: "Apple",
        category: "streaming",
        homepage: "https://music.apple.com/",
        accessSummary: "Music streaming with playlists, radio, lossless audio support, and offline listening.",
        accessTags: ["music-streaming", "radio", "offline-listening", "ad-free-audio"]
      },
      {
        id: "youtube-premium",
        canonicalName: "YouTube Premium",
        aliases: ["youtube premium", "youtube music premium"],
        merchantName: "Google",
        category: "streaming",
        homepage: "https://www.youtube.com/premium",
        accessSummary: "Ad-free YouTube, background play, downloads, and YouTube Music Premium.",
        accessTags: ["video-streaming", "music-streaming", "ad-free-video", "offline-listening", "background-play"]
      },
      {
        id: "youtube-tv",
        canonicalName: "YouTube TV",
        aliases: ["youtube tv", "yt tv"],
        merchantName: "Google",
        category: "streaming",
        homepage: "https://tv.youtube.com/",
        accessSummary: "Live TV streaming with sports, news, entertainment channels, cloud DVR, and YouTube TV originals.",
        accessTags: ["live-tv", "video-streaming", "sports", "news", "cloud-dvr"]
      },
      {
        id: "amazon-prime",
        canonicalName: "Amazon Prime",
        aliases: ["amazon prime", "prime membership"],
        merchantName: "Amazon",
        category: "shopping",
        homepage: "https://www.amazon.com/prime",
        accessSummary: "Shopping delivery benefits, Prime Video, Prime Music, Prime Gaming, reading perks, and exclusive deals.",
        accessTags: ["shopping-delivery", "video-streaming", "music-streaming", "gaming-perks", "exclusive-deals"]
      },
      {
        id: "apple-tv-plus",
        canonicalName: "Apple TV+",
        aliases: ["apple tv plus", "apple tv+", "apple tv"],
        merchantName: "Apple",
        category: "streaming",
        homepage: "https://tv.apple.com/",
        accessSummary: "Apple original series, movies, documentaries, family entertainment, and offline viewing in the Apple TV app.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "original-shows", "offline-viewing"]
      },
      {
        id: "paramount-plus",
        canonicalName: "Paramount+",
        aliases: ["paramount plus", "paramount+", "cbs all access"],
        merchantName: "Paramount",
        category: "streaming",
        homepage: "https://www.paramountplus.com/",
        accessSummary: "Movies, TV series, Paramount originals, live sports, news, and CBS programming in supported plans.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "live-tv", "sports", "news"]
      },
      {
        id: "peacock",
        canonicalName: "Peacock",
        aliases: ["peacock", "peacock premium"],
        merchantName: "NBCUniversal",
        category: "streaming",
        homepage: "https://www.peacocktv.com/",
        accessSummary: "NBCUniversal movies, shows, originals, live sports, news, and next-day NBC programming.",
        accessTags: ["video-streaming", "movie-library", "tv-series", "live-tv", "sports", "news"]
      },
      {
        id: "crunchyroll",
        canonicalName: "Crunchyroll",
        aliases: ["crunchyroll", "crunchyroll premium"],
        merchantName: "Crunchyroll",
        category: "streaming",
        homepage: "https://www.crunchyroll.com/",
        accessSummary: "Anime streaming with simulcasts, manga access in supported plans, offline viewing, and ad-free episodes.",
        accessTags: ["video-streaming", "anime", "tv-series", "offline-viewing", "ad-free-video"]
      },
      {
        id: "mubi",
        canonicalName: "MUBI",
        aliases: ["mubi"],
        merchantName: "MUBI",
        category: "streaming",
        homepage: "https://mubi.com/",
        accessSummary: "Curated independent, classic, international, and arthouse films with streaming and offline viewing.",
        accessTags: ["video-streaming", "movie-library", "independent-film", "international-film", "offline-viewing"]
      },
      {
        id: "dazn",
        canonicalName: "DAZN",
        aliases: ["dazn"],
        merchantName: "DAZN",
        category: "streaming",
        homepage: "https://www.dazn.com/",
        accessSummary: "Sports streaming with live and on-demand events, fight sports, highlights, and regional sports content.",
        accessTags: ["sports", "live-tv", "video-streaming", "on-demand-video"]
      },
      {
        id: "microsoft-365",
        canonicalName: "Microsoft 365",
        aliases: ["microsoft 365", "office 365", "m365"],
        merchantName: "Microsoft",
        category: "productivity",
        homepage: "https://www.microsoft.com/microsoft-365",
        accessSummary: "Office apps, cloud storage, email features, collaboration, and productivity tools.",
        accessTags: ["office-suite", "document-editing", "spreadsheet-editing", "presentation-editing", "cloud-storage", "collaboration"]
      },
      {
        id: "google-workspace",
        canonicalName: "Google Workspace",
        aliases: ["google workspace", "g suite", "google suite"],
        merchantName: "Google",
        category: "productivity",
        homepage: "https://workspace.google.com/",
        accessSummary: "Gmail, Drive, Docs, Sheets, Slides, Meet, calendar, and collaboration tools.",
        accessTags: ["office-suite", "document-editing", "spreadsheet-editing", "presentation-editing", "cloud-storage", "video-meetings", "collaboration"]
      },
      {
        id: "google-one",
        canonicalName: "Google One",
        aliases: ["google one", "google storage"],
        merchantName: "Google",
        category: "storage",
        homepage: "https://one.google.com/",
        accessSummary: "Expanded Google account storage across Drive, Gmail, and Photos, with plan benefits.",
        accessTags: ["cloud-storage", "photo-storage", "account-storage"]
      },
      {
        id: "icloud-plus",
        canonicalName: "iCloud+",
        aliases: ["icloud+", "icloud plus", "icloud storage"],
        merchantName: "Apple",
        category: "storage",
        homepage: "https://www.icloud.com/",
        accessSummary: "Apple cloud storage for photos, backups, files, and iCloud privacy features.",
        accessTags: ["cloud-storage", "photo-storage", "device-backup", "account-storage"]
      },
      {
        id: "dropbox",
        canonicalName: "Dropbox",
        aliases: ["dropbox", "dropbox plus"],
        merchantName: "Dropbox",
        category: "storage",
        homepage: "https://www.dropbox.com/",
        accessSummary: "Cloud file storage, sync, sharing, backup, and collaboration features.",
        accessTags: ["cloud-storage", "file-sync", "file-sharing", "device-backup", "collaboration"]
      },
      {
        id: "adobe-creative-cloud",
        canonicalName: "Adobe Creative Cloud",
        aliases: ["adobe creative cloud", "creative cloud", "adobe cc"],
        merchantName: "Adobe",
        category: "productivity",
        homepage: "https://www.adobe.com/creativecloud.html",
        accessSummary: "Creative apps for design, photo editing, video editing, PDF workflows, fonts, and assets.",
        accessTags: ["creative-suite", "photo-editing", "video-editing", "design-tools", "pdf-tools", "cloud-storage"]
      },
      {
        id: "canva-pro",
        canonicalName: "Canva Pro",
        aliases: ["canva", "canva pro"],
        merchantName: "Canva",
        category: "productivity",
        homepage: "https://www.canva.com/",
        accessSummary: "Design creation, templates, brand kits, stock assets, collaboration, and export tools.",
        accessTags: ["design-tools", "templates", "stock-assets", "brand-kit", "collaboration"]
      },
      {
        id: "figma",
        canonicalName: "Figma",
        aliases: ["figma", "figma professional"],
        merchantName: "Figma",
        category: "productivity",
        homepage: "https://www.figma.com/",
        accessSummary: "Interface design, prototyping, design systems, whiteboarding, and team collaboration.",
        accessTags: ["design-tools", "prototyping", "whiteboarding", "design-systems", "collaboration"]
      },
      {
        id: "notion",
        canonicalName: "Notion",
        aliases: ["notion", "notion plus"],
        merchantName: "Notion",
        category: "productivity",
        homepage: "https://www.notion.so/",
        accessSummary: "Notes, docs, databases, project spaces, wikis, and team collaboration.",
        accessTags: ["notes", "wiki", "databases", "project-management", "collaboration"]
      },
      {
        id: "slack",
        canonicalName: "Slack",
        aliases: ["slack"],
        merchantName: "Slack",
        category: "productivity",
        homepage: "https://slack.com/",
        accessSummary: "Team messaging, channels, huddles, workflow automation, and collaboration integrations.",
        accessTags: ["team-chat", "video-meetings", "workflow-automation", "collaboration"]
      },
      {
        id: "zoom",
        canonicalName: "Zoom",
        aliases: ["zoom", "zoom one", "zoom workplace"],
        merchantName: "Zoom",
        category: "productivity",
        homepage: "https://zoom.us/",
        accessSummary: "Video meetings, webinars, team chat, phone features, and collaboration tools.",
        accessTags: ["video-meetings", "webinars", "team-chat", "collaboration"]
      },
      {
        id: "github-copilot",
        canonicalName: "GitHub Copilot",
        aliases: ["github copilot", "copilot"],
        merchantName: "GitHub",
        category: "productivity",
        homepage: "https://github.com/features/copilot",
        accessSummary: "AI coding assistance, code completions, chat, and developer workflow support.",
        accessTags: ["ai-assistant", "coding-assistant", "developer-tools"]
      },
      {
        id: "chatgpt-plus",
        canonicalName: "ChatGPT Plus",
        aliases: ["chatgpt plus", "chatgpt", "openai chatgpt"],
        merchantName: "OpenAI",
        category: "productivity",
        homepage: "https://chatgpt.com/",
        accessSummary: "AI assistant access for writing, research, coding help, analysis, and productivity workflows.",
        accessTags: ["ai-assistant", "writing-assistant", "research-assistant", "coding-assistant", "productivity-ai"]
      },
      {
        id: "grammarly",
        canonicalName: "Grammarly",
        aliases: ["grammarly", "grammarly premium"],
        merchantName: "Grammarly",
        category: "productivity",
        homepage: "https://www.grammarly.com/",
        accessSummary: "Writing assistance, grammar checks, rewriting, tone guidance, and productivity writing tools.",
        accessTags: ["writing-assistant", "grammar-checking", "productivity-ai"]
      },
      {
        id: "calm",
        canonicalName: "Calm",
        aliases: ["calm"],
        merchantName: "Calm",
        category: "wellness",
        homepage: "https://www.calm.com/",
        accessSummary: "Meditation, sleep stories, breathing exercises, relaxation audio, and wellness content.",
        accessTags: ["meditation", "sleep-audio", "breathing-exercises", "wellness-content"]
      },
      {
        id: "headspace",
        canonicalName: "Headspace",
        aliases: ["headspace"],
        merchantName: "Headspace",
        category: "wellness",
        homepage: "https://www.headspace.com/",
        accessSummary: "Meditation, mindfulness exercises, sleep content, coaching, and mental wellness tools.",
        accessTags: ["meditation", "sleep-audio", "mindfulness", "wellness-content"]
      },
      {
        id: "peloton-app",
        canonicalName: "Peloton App",
        aliases: ["peloton", "peloton app"],
        merchantName: "Peloton",
        category: "wellness",
        homepage: "https://www.onepeloton.com/app",
        accessSummary: "Workout classes, cycling, strength, yoga, running, and fitness programs.",
        accessTags: ["fitness-classes", "workout-video", "cycling", "strength-training", "yoga"]
      },
      {
        id: "nordvpn",
        canonicalName: "NordVPN",
        aliases: ["nordvpn", "nord vpn"],
        merchantName: "Nord Security",
        category: "utilities",
        homepage: "https://nordvpn.com/",
        accessSummary: "VPN privacy, secure browsing, encrypted connections, and location masking.",
        accessTags: ["vpn", "privacy-tools", "secure-browsing"]
      },
      {
        id: "onepassword",
        canonicalName: "1Password",
        aliases: ["1password", "onepassword", "one password"],
        merchantName: "1Password",
        category: "utilities",
        homepage: "https://1password.com/",
        accessSummary: "Password management, secure vaults, passkeys, secrets, and account security tools.",
        accessTags: ["password-manager", "secure-vault", "passkeys", "account-security"]
      }
    ],
    subscriptions: []
  };
})();
