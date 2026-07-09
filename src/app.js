(function runSubCheckApp() {
  var SUBSCRIPTIONS_KEY = "subcheck.phase1.subscriptions";
  var PREFS_KEY = "subcheck.phase1.preferences";
  var USERS_KEY = "subcheck.phase1.users";
  var SESSION_KEY = "subcheck.phase1.session";
  var LEGACY_EXAMPLE_SUBSCRIPTIONS = {
    "sub-spotify": "Spotify",
    "sub-netflix": "Netflix",
    "sub-hulu": "Hulu",
    "sub-microsoft-365": "Microsoft 365",
    "sub-google-one": "Google One",
    "sub-calm": "Calm",
    "sub-dropbox": "Dropbox",
    "sub-figma": "Figma Professional"
  };
  var seed = window.SubCheckSeed;
  var serviceCatalog = seed.serviceCatalog || [];
  var app = document.getElementById("app");
  var modalRoot = document.getElementById("modal-root");

  var state = {
    view: "dashboard",
    filter: "all",
    authMode: "signup",
    authError: "",
    currentUser: loadSessionUser(),
    subscriptions: [],
    preferences: clone(seed.preferences)
  };

  if (state.currentUser) {
    hydrateUserData();
  }

  function loadUsers() {
    var saved = window.localStorage.getItem(USERS_KEY);
    if (!saved) {
      return [];
    }

    try {
      var parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function saveUsers(users) {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function loadSessionUser() {
    var saved = window.localStorage.getItem(SESSION_KEY);
    if (!saved) {
      return null;
    }

    try {
      var session = JSON.parse(saved);
      var users = loadUsers();
      var user = users.find(function find(item) {
        return item.id === session.userId;
      });
      return user ? publicUser(user) : null;
    } catch (error) {
      return null;
    }
  }

  function publicUser(user) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt
    };
  }

  function setCurrentUser(user) {
    state.currentUser = publicUser(user);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id }));
    hydrateUserData();
  }

  function clearSession() {
    window.localStorage.removeItem(SESSION_KEY);
    state.currentUser = null;
    state.subscriptions = [];
    state.preferences = clone(seed.preferences);
    state.view = "dashboard";
    state.filter = "all";
    state.authMode = "signin";
    state.authError = "";
    closeModal();
  }

  function hydrateUserData() {
    state.subscriptions = loadSubscriptions();
    state.preferences = loadPreferences();
  }

  function userStorageKey(baseKey) {
    return state.currentUser ? baseKey + "." + state.currentUser.id : baseKey;
  }

  function loadSubscriptions() {
    var saved = state.currentUser ? window.localStorage.getItem(userStorageKey(SUBSCRIPTIONS_KEY)) : null;
    if (!saved) {
      return clone(seed.subscriptions);
    }

    try {
      var parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? normalizeSavedSubscriptions(parsed) : clone(seed.subscriptions);
    } catch (error) {
      return clone(seed.subscriptions);
    }
  }

  function normalizeSavedSubscriptions(subscriptions) {
    var cleaned = subscriptions.filter(function removeLegacyExample(subscription) {
      return LEGACY_EXAMPLE_SUBSCRIPTIONS[subscription.id] !== subscription.name;
    });
    var normalized = cleaned.map(ensureServiceIntelligence);

    if (state.currentUser && JSON.stringify(normalized) !== JSON.stringify(subscriptions)) {
      window.localStorage.setItem(userStorageKey(SUBSCRIPTIONS_KEY), JSON.stringify(normalized));
    }

    return normalized;
  }

  function loadPreferences() {
    var saved = state.currentUser ? window.localStorage.getItem(userStorageKey(PREFS_KEY)) : null;
    if (!saved) {
      return clone(seed.preferences);
    }

    try {
      return Object.assign({}, seed.preferences, JSON.parse(saved));
    } catch (error) {
      return clone(seed.preferences);
    }
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function saveSubscriptions() {
    if (!state.currentUser) {
      return;
    }
    window.localStorage.setItem(userStorageKey(SUBSCRIPTIONS_KEY), JSON.stringify(state.subscriptions));
  }

  function savePreferences() {
    if (!state.currentUser) {
      return;
    }
    window.localStorage.setItem(userStorageKey(PREFS_KEY), JSON.stringify(state.preferences));
  }

  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  function createSalt() {
    var bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(bytes);
    } else {
      bytes = bytes.map(function randomByte() {
        return Math.floor(Math.random() * 256);
      });
    }
    return bytesToHex(bytes);
  }

  function bytesToHex(bytes) {
    return Array.prototype.map.call(bytes, function toHex(byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
  }

  function fallbackHash(value) {
    var hash = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return ("00000000" + (hash >>> 0).toString(16)).slice(-8);
  }

  async function hashPassword(password, salt) {
    var value = salt + ":" + password;
    if (window.crypto && window.crypto.subtle && window.TextEncoder) {
      var encoded = new TextEncoder().encode(value);
      var digest = await window.crypto.subtle.digest("SHA-256", encoded);
      return bytesToHex(new Uint8Array(digest));
    }
    return "local-fallback-" + fallbackHash(value);
  }

  function currency(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: state.preferences.currency || "USD",
      maximumFractionDigits: value >= 100 ? 0 : 2
    }).format(value || 0);
  }

  function prettyDate(value) {
    if (!value) {
      return "Not set";
    }

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(parseLocalDate(value));
  }

  function parseLocalDate(value) {
    var parts = String(value).split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
  }

  function today() {
    var date = new Date();
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function daysUntil(value) {
    if (!value) {
      return Infinity;
    }

    var diff = parseLocalDate(value).getTime() - today().getTime();
    return Math.ceil(diff / 86400000);
  }

  function monthlyCost(subscription) {
    var price = Number(subscription.price) || 0;
    return subscription.interval === "annual" ? price / 12 : price;
  }

  function annualCost(subscription) {
    var price = Number(subscription.price) || 0;
    return subscription.interval === "annual" ? price : price * 12;
  }

  function categoryMeta(category) {
    return seed.categories[category] || {
      label: "Other",
      shortLabel: "Other",
      color: "#64748b",
      softColor: "#e2e8f0"
    };
  }

  function ensureServiceIntelligence(subscription) {
    if (subscription.serviceIntelligence && Array.isArray(subscription.serviceIntelligence.accessTags)) {
      return subscription;
    }

    return Object.assign({}, subscription, {
      serviceIntelligence: buildServiceIntelligence(subscription.name, subscription.category, subscription.accessNotes || subscription.notes || "")
    });
  }

  function normalizeServiceKey(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/\+/g, " plus ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\b(inc|llc|ltd|subscription|premium|plus|pro|plan|app)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function serviceSearchTerms(service) {
    return [service.canonicalName].concat(service.aliases || []).map(normalizeServiceKey).filter(Boolean);
  }

  function serviceMatchScore(nameKey, service) {
    var terms = serviceSearchTerms(service);
    var nameTokens = nameKey.split(" ").filter(Boolean);
    var best = 0;

    terms.forEach(function scoreTerm(term) {
      if (term === nameKey) {
        best = Math.max(best, 100);
        return;
      }

      if (term && nameKey && (term.indexOf(nameKey) >= 0 || nameKey.indexOf(term) >= 0)) {
        best = Math.max(best, 82);
        return;
      }

      var termTokens = term.split(" ").filter(Boolean);
      var overlap = nameTokens.filter(function inBoth(token) {
        return termTokens.indexOf(token) >= 0;
      }).length;
      var score = termTokens.length ? Math.round((overlap / termTokens.length) * 72) : 0;
      best = Math.max(best, score);
    });

    return best;
  }

  function matchServiceCatalog(name) {
    var nameKey = normalizeServiceKey(name);
    if (!nameKey) {
      return null;
    }

    return serviceCatalog
      .map(function toCandidate(service) {
        return {
          service: service,
          score: serviceMatchScore(nameKey, service)
        };
      })
      .filter(function confident(candidate) {
        return candidate.score >= 70;
      })
      .sort(function byScore(a, b) {
        return b.score - a.score;
      })[0] || null;
  }

  function parseAccessTags(value) {
    return unique(
      String(value || "")
        .split(/[,;\n]+/)
        .map(function toTag(part) {
          return normalizeServiceKey(part).replace(/\s+/g, "-");
        })
        .filter(function meaningful(tag) {
          return tag.length > 1;
        })
    );
  }

  function unique(values) {
    var seen = {};
    return values.filter(function once(value) {
      if (!value || seen[value]) {
        return false;
      }
      seen[value] = true;
      return true;
    });
  }

  function buildServiceIntelligence(name, category, accessNotes) {
    var match = matchServiceCatalog(name);

    if (match) {
      var service = match.service;
      return {
        status: "recognized",
        serviceId: service.id,
        canonicalName: service.canonicalName,
        confidence: match.score >= 95 ? "High" : "Medium",
        source: "Local service catalog",
        checkedAt: new Date().toISOString(),
        homepage: service.homepage,
        merchantName: service.merchantName || service.canonicalName,
        accessSummary: String(accessNotes || service.accessSummary || "").trim(),
        accessTags: unique(service.accessTags || [])
      };
    }

    var manualTags = parseAccessTags(accessNotes);
    return {
      status: "unverified",
      serviceId: "",
      canonicalName: "",
      confidence: "Low",
      source: "Manual entry",
      checkedAt: new Date().toISOString(),
      homepage: "",
      merchantName: "",
      accessSummary: String(accessNotes || "").trim(),
      accessTags: manualTags.length ? manualTags : ["category-" + category]
    };
  }

  function serviceAccessTags(subscription) {
    var intelligence = subscription.serviceIntelligence || {};
    if (Array.isArray(intelligence.accessTags) && intelligence.accessTags.length) {
      return intelligence.accessTags;
    }
    return ["category-" + subscription.category];
  }

  function sharedAccessTags(first, second) {
    var secondTags = serviceAccessTags(second);
    return serviceAccessTags(first).filter(function shared(tag) {
      return secondTags.indexOf(tag) >= 0;
    });
  }

  function formatAccessTag(tag) {
    return labelize(String(tag || "").replace(/^category-/, ""));
  }

  function accessSummary(subscription) {
    var intelligence = subscription.serviceIntelligence || {};
    if (intelligence.accessSummary) {
      return intelligence.accessSummary;
    }
    if (intelligence.status === "unverified") {
      return "Access not verified. Add access/features in the subscription form to improve overlap checks.";
    }
    return "No access details yet.";
  }

  function activeSubscriptions() {
    return state.subscriptions.filter(function isBillable(subscription) {
      return subscription.status !== "paused";
    });
  }

  function dashboardStats() {
    var billable = activeSubscriptions();
    var monthly = billable.reduce(function sum(total, subscription) {
      return total + monthlyCost(subscription);
    }, 0);
    var upcoming = billable.filter(function dueSoon(subscription) {
      var days = daysUntil(subscription.nextBillDate);
      return days >= 0 && days <= 30;
    });
    var alerts = buildAlerts();
    var leakage = leakageSummary();

    return {
      monthly: monthly,
      annual: monthly * 12,
      upcomingCount: upcoming.length,
      upcomingAmount: upcoming.reduce(function sum(total, subscription) {
        return total + (Number(subscription.price) || 0);
      }, 0),
      alertCount: alerts.length,
      leakageMonthly: leakage.totalMonthly,
      leakageAnnual: leakage.totalMonthly * 12
    };
  }

  function categoryTotals() {
    var totals = {};
    activeSubscriptions().forEach(function add(subscription) {
      totals[subscription.category] = (totals[subscription.category] || 0) + monthlyCost(subscription);
    });
    return Object.keys(totals)
      .map(function toEntry(category) {
        return {
          category: category,
          label: categoryMeta(category).label,
          shortLabel: categoryMeta(category).shortLabel,
          color: categoryMeta(category).color,
          value: totals[category]
        };
      })
      .sort(function byValue(a, b) {
        return b.value - a.value;
      });
  }

  function leakageSummary() {
    var unused = 0;
    var occasional = 0;

    activeSubscriptions().forEach(function score(subscription) {
      if (subscription.usageStatus === "unused") {
        unused += monthlyCost(subscription);
      }

      if (subscription.usageStatus === "occasional") {
        occasional += monthlyCost(subscription) * 0.35;
      }
    });

    var redundancy = redundantGroups().reduce(function sum(total, group) {
      return total + group.estimatedMonthlySavings;
    }, 0);

    return {
      unusedMonthly: unused,
      occasionalMonthly: occasional,
      redundancyMonthly: redundancy,
      totalMonthly: unused + occasional + redundancy
    };
  }

  function redundantGroups() {
    var subscriptions = activeSubscriptions();
    var parent = {};
    var overlapByPair = {};

    subscriptions.forEach(function init(subscription) {
      parent[subscription.id] = subscription.id;
    });

    function find(id) {
      if (parent[id] !== id) {
        parent[id] = find(parent[id]);
      }
      return parent[id];
    }

    function connect(firstId, secondId) {
      var firstRoot = find(firstId);
      var secondRoot = find(secondId);
      if (firstRoot !== secondRoot) {
        parent[secondRoot] = firstRoot;
      }
    }

    subscriptions.forEach(function compare(first, firstIndex) {
      subscriptions.slice(firstIndex + 1).forEach(function comparePair(second) {
        var overlap = sharedAccessTags(first, second);
        if (!overlap.length) {
          return;
        }

        connect(first.id, second.id);
        overlapByPair[[first.id, second.id].sort().join("|")] = overlap;
      });
    });

    var grouped = {};
    subscriptions.forEach(function group(subscription) {
      var root = find(subscription.id);
      if (!grouped[root]) {
        grouped[root] = [];
      }
      grouped[root].push(subscription);
    });

    return Object.keys(grouped)
      .map(function toRedundantGroup(root) {
        var groupSubscriptions = grouped[root];
        if (groupSubscriptions.length < 2) {
          return null;
        }

        var overlapCounts = {};
        groupSubscriptions.forEach(function countAgainst(first, firstIndex) {
          groupSubscriptions.slice(firstIndex + 1).forEach(function countPair(second) {
            var pairKey = [first.id, second.id].sort().join("|");
            (overlapByPair[pairKey] || []).forEach(function add(tag) {
              overlapCounts[tag] = (overlapCounts[tag] || 0) + 1;
            });
          });
        });

        var overlapTags = Object.keys(overlapCounts).sort(function byCount(a, b) {
          return overlapCounts[b] - overlapCounts[a];
        });
        var sorted = groupSubscriptions.slice().sort(function byPriority(a, b) {
          if (a.isEssential !== b.isEssential) {
            return a.isEssential ? -1 : 1;
          }
          if (serviceIsRecognized(a) !== serviceIsRecognized(b)) {
            return serviceIsRecognized(a) ? -1 : 1;
          }
          return monthlyCost(b) - monthlyCost(a);
        });
        var keep = sorted[0];
        var review = sorted.slice(1);
        var savings = review.reduce(function sum(total, subscription) {
          var factor = subscription.usageStatus === "unused" ? 1 : Math.min(0.65, 0.35 + (overlapTags.length * 0.08));
          return total + monthlyCost(subscription) * factor;
        }, 0);

        return {
          id: "overlap-" + overlapTags.join("-"),
          label: overlapTags.slice(0, 3).map(formatAccessTag).join(", "),
          accessTags: overlapTags,
          keep: keep,
          review: review,
          estimatedMonthlySavings: savings
        };
      })
      .filter(Boolean);
  }

  function serviceIsRecognized(subscription) {
    return subscription.serviceIntelligence && subscription.serviceIntelligence.status === "recognized";
  }

  function buildAlerts() {
    var alerts = [];
    var renewalWindowDays = Math.ceil((Number(state.preferences.renewalWindowHours) || 72) / 24);
    var annualWindowDays = Number(state.preferences.annualWarningDays) || 14;
    var highCostThreshold = Number(state.preferences.highCostThreshold) || 25;

    activeSubscriptions().forEach(function inspect(subscription) {
      var billDays = daysUntil(subscription.nextBillDate);
      var trialDays = daysUntil(subscription.trialEndsAt);
      var price = Number(subscription.price) || 0;

      if (subscription.status === "trial" && trialDays >= 0 && trialDays <= renewalWindowDays) {
        alerts.push({
          id: subscription.id + "-trial",
          subscription: subscription,
          type: "Trial ending",
          severity: "critical",
          message: "Trial converts in " + relativeDays(trialDays) + ". Review before it becomes paid."
        });
      }

      if (billDays >= 0 && billDays <= renewalWindowDays) {
        alerts.push({
          id: subscription.id + "-renewal",
          subscription: subscription,
          type: "Renewal due",
          severity: billDays <= 1 ? "critical" : "warning",
          message: "Next bill is " + relativeDays(billDays) + " for " + currency(price) + "."
        });
      }

      if (subscription.interval === "annual" && billDays >= 0 && billDays <= annualWindowDays) {
        alerts.push({
          id: subscription.id + "-annual",
          subscription: subscription,
          type: "Annual renewal",
          severity: "warning",
          message: "Annual plan renews on " + prettyDate(subscription.nextBillDate) + "."
        });
      }

      if (price >= highCostThreshold && billDays >= 0 && billDays <= 7) {
        alerts.push({
          id: subscription.id + "-threshold",
          subscription: subscription,
          type: "High-cost charge",
          severity: "notice",
          message: "Charge is above your " + currency(highCostThreshold) + " review threshold."
        });
      }
    });

    return alerts.sort(function byUrgency(a, b) {
      return daysUntil(a.subscription.nextBillDate) - daysUntil(b.subscription.nextBillDate);
    });
  }

  function buildRecommendations() {
    var recommendations = [];

    activeSubscriptions().forEach(function inspect(subscription) {
      if (subscription.usageStatus === "unused") {
        recommendations.push({
          id: subscription.id + "-unused",
          title: "Cancel or pause " + subscription.name,
          type: "Unused subscription",
          estimatedMonthlySavings: monthlyCost(subscription),
          confidence: "High",
          subscriptionIds: [subscription.id],
          reason: "Marked unused and still billing " + billingCadence(subscription) + "."
        });
      }

      if (subscription.usageStatus === "occasional" && monthlyCost(subscription) >= 10) {
        recommendations.push({
          id: subscription.id + "-downgrade",
          title: "Review " + subscription.name + " usage",
          type: "Usage mismatch",
          estimatedMonthlySavings: monthlyCost(subscription) * 0.35,
          confidence: "Medium",
          subscriptionIds: [subscription.id],
          reason: "Occasional usage suggests a lower tier or temporary pause may be enough."
        });
      }

      if (subscription.status === "trial" && daysUntil(subscription.trialEndsAt) <= 3) {
        recommendations.push({
          id: subscription.id + "-trial-review",
          title: "Decide on " + subscription.name + " before trial conversion",
          type: "Trial protection",
          estimatedMonthlySavings: monthlyCost(subscription),
          confidence: "High",
          subscriptionIds: [subscription.id],
          reason: "Trial mode is active and the conversion window is inside your alert threshold."
        });
      }
    });

    redundantGroups().forEach(function addGroup(group) {
      recommendations.push({
        id: group.id + "-redundancy",
        title: "Resolve access overlap in " + group.label,
        type: "Redundant overlap",
        estimatedMonthlySavings: group.estimatedMonthlySavings,
        confidence: group.accessTags.some(function verified(tag) {
          return tag.indexOf("category-") !== 0;
        }) ? "High" : "Medium",
        subscriptionIds: group.review.map(function toId(subscription) {
          return subscription.id;
        }),
        reason: "These subscriptions overlap on " + group.accessTags.slice(0, 4).map(formatAccessTag).join(", ") + ". Keep " + group.keep.name + " as the primary option and review " + group.review.map(function toName(subscription) {
          return subscription.name;
        }).join(", ") + "."
      });
    });

    return recommendations.sort(function bySavings(a, b) {
      return b.estimatedMonthlySavings - a.estimatedMonthlySavings;
    });
  }

  function billingCadence(subscription) {
    return subscription.interval === "annual" ? "annually" : "monthly";
  }

  function relativeDays(days) {
    if (days === 0) {
      return "today";
    }

    if (days === 1) {
      return "tomorrow";
    }

    return "in " + days + " days";
  }

  function render() {
    if (!state.currentUser) {
      app.className = "auth-shell";
      modalRoot.innerHTML = "";
      app.innerHTML = renderAuthView();
      return;
    }

    app.className = "app-shell";
    app.innerHTML = [
      '<aside class="sidebar" aria-label="Primary navigation">',
      renderBrand(),
      renderNavigation(),
      renderSidebarSummary(),
      "</aside>",
      '<main class="main-panel">',
      renderTopBar(),
      renderCurrentView(),
      "</main>"
    ].join("");
  }

  function renderAuthView() {
    var isSignup = state.authMode === "signup";
    return [
      '<main class="auth-page">',
      '<section class="auth-card" aria-labelledby="auth-title">',
      renderBrand(),
      '<div class="auth-title">',
      '<p class="eyebrow">Local MVP account</p>',
      '<h1 id="auth-title">' + (isSignup ? "Create your SubCheck account" : "Sign in to SubCheck") + "</h1>",
      '<p>Your dashboard, subscriptions, and settings stay separated in this browser.</p>',
      "</div>",
      '<div class="mode-switch" role="tablist" aria-label="Authentication mode">',
      '<button type="button" class="' + (isSignup ? "is-active" : "") + '" data-action="set-auth-mode" data-mode="signup" role="tab" aria-selected="' + String(isSignup) + '">Sign up</button>',
      '<button type="button" class="' + (!isSignup ? "is-active" : "") + '" data-action="set-auth-mode" data-mode="signin" role="tab" aria-selected="' + String(!isSignup) + '">Sign in</button>',
      "</div>",
      '<form class="auth-form" data-form="auth">',
      '<input type="hidden" name="mode" value="' + state.authMode + '">',
      isSignup ? '<label>Full name<input name="name" required autocomplete="name" placeholder="Alex Morgan"></label>' : "",
      '<label>Email<input name="email" type="email" required autocomplete="email" placeholder="you@example.com"></label>',
      '<label>Password<input name="password" type="password" required minlength="8" autocomplete="' + (isSignup ? "new-password" : "current-password") + '" placeholder="At least 8 characters"></label>',
      state.authError ? '<p class="auth-error" role="alert">' + escapeHtml(state.authError) + "</p>" : "",
      '<button class="primary-button" type="submit">' + icon(isSignup ? "user-plus" : "check") + "<span>" + (isSignup ? "Create account" : "Sign in") + "</span></button>",
      "</form>",
      '<p class="auth-note">This Phase 1 account system is local to your browser. Production auth belongs in Phase 2 with Supabase Auth.</p>',
      "</section>",
      '<aside class="auth-context" aria-label="Local account details">',
      '<div>',
      '<p class="eyebrow">What gets stored</p>',
      '<h2>Private local workspace</h2>',
      '<p>SubCheck saves account records, hashed passwords, subscriptions, and alert settings in browser localStorage for this MVP.</p>',
      "</div>",
      '<div class="auth-fact-list">',
      '<div><span>' + icon("user") + '</span><strong>User-scoped data</strong><p>Each local account has its own subscriptions and settings.</p></div>',
      '<div><span>' + icon("shield") + '</span><strong>Hashed passwords</strong><p>Passwords are hashed with a per-user salt before local storage.</p></div>',
      '<div><span>' + icon("wallet") + '</span><strong>Ready to upgrade</strong><p>The dashboard can later connect to Supabase and Plaid without changing the core views.</p></div>',
      "</div>",
      "</aside>",
      "</main>"
    ].join("");
  }

  function renderBrand() {
    return [
      '<div class="brand-block">',
      '<div class="brand-mark" aria-hidden="true">S</div>',
      '<div>',
      '<p class="brand-name">SubCheck</p>',
      '<p class="brand-subtitle">Phase 1 MVP</p>',
      "</div>",
      "</div>"
    ].join("");
  }

  function renderNavigation() {
    var items = [
      ["dashboard", "Dashboard", "layout"],
      ["subscriptions", "Subscriptions", "card"],
      ["alerts", "Alerts", "bell"],
      ["savings", "Savings", "spark"],
      ["settings", "Settings", "settings"]
    ];

    return [
      '<nav class="nav-stack">',
      items
        .map(function item(parts) {
          var id = parts[0];
          var label = parts[1];
          var iconName = parts[2];
          var active = state.view === id ? " is-active" : "";
          return '<button class="nav-button' + active + '" data-action="navigate" data-view="' + id + '">' + icon(iconName) + '<span>' + label + "</span></button>";
        })
        .join(""),
      "</nav>"
    ].join("");
  }

  function renderSidebarSummary() {
    var stats = dashboardStats();
    return [
      '<div class="sidebar-summary">',
      '<span class="eyebrow">Tracked spend</span>',
      '<strong>' + currency(stats.monthly) + '</strong>',
      '<span>' + state.subscriptions.length + ' subscriptions monitored</span>',
      '<div class="signed-in-box">',
      '<span class="eyebrow">Signed in</span>',
      '<b>' + escapeHtml(state.currentUser.name) + "</b>",
      '<span>' + escapeHtml(state.currentUser.email) + "</span>",
      "</div>",
      "</div>"
    ].join("");
  }

  function renderTopBar() {
    return [
      '<header class="topbar">',
      '<div>',
      '<p class="eyebrow">' + viewEyebrow() + "</p>",
      '<h1>' + viewTitle() + "</h1>",
      "</div>",
      '<div class="topbar-actions">',
      '<button class="secondary-button" data-action="export-data">' + icon("download") + "<span>Export</span></button>",
      '<button class="primary-button" data-action="open-form">' + icon("plus") + "<span>Add subscription</span></button>",
      '<button class="secondary-button" data-action="sign-out">' + icon("log-out") + "<span>Sign out</span></button>",
      "</div>",
      "</header>"
    ].join("");
  }

  function viewEyebrow() {
    var labels = {
      dashboard: "Command center",
      subscriptions: "Manual tracking",
      alerts: "Renewal protection",
      savings: "Optimization logic",
      settings: "Local account settings"
    };
    return labels[state.view] || "SubCheck";
  }

  function viewTitle() {
    var labels = {
      dashboard: "Subscription dashboard",
      subscriptions: "Subscriptions",
      alerts: "Alerts center",
      savings: "Savings recommendations",
      settings: "Settings"
    };
    return labels[state.view] || "SubCheck";
  }

  function renderCurrentView() {
    if (state.view === "subscriptions") {
      return renderSubscriptionsView();
    }
    if (state.view === "alerts") {
      return renderAlertsView();
    }
    if (state.view === "savings") {
      return renderSavingsView();
    }
    if (state.view === "settings") {
      return renderSettingsView();
    }
    return renderDashboardView();
  }

  function renderDashboardView() {
    var stats = dashboardStats();
    var alerts = buildAlerts().slice(0, 4);
    var recommendations = buildRecommendations().slice(0, 3);

    return [
      '<section class="kpi-grid" aria-label="Dashboard summary">',
      renderKpi("Monthly spend", currency(stats.monthly), currency(stats.annual) + " annualized", "wallet"),
      renderKpi("Upcoming charges", currency(stats.upcomingAmount), stats.upcomingCount + " due in 30 days", "calendar"),
      renderKpi("Active alerts", String(stats.alertCount), "Trials and renewals needing review", "bell"),
      renderKpi("Potential savings", currency(stats.leakageMonthly), currency(stats.leakageAnnual) + " annual estimate", "spark"),
      "</section>",
      '<section class="dashboard-grid">',
      renderSpendDistribution(),
      renderUpcomingCharges(),
      renderRecommendationPreview(recommendations),
      renderAlertPreview(alerts),
      "</section>"
    ].join("");
  }

  function renderKpi(label, value, helper, iconName) {
    return [
      '<article class="metric-card">',
      '<div class="metric-icon" aria-hidden="true">' + icon(iconName) + "</div>",
      '<div>',
      '<p>' + label + "</p>",
      '<strong>' + value + "</strong>",
      '<span>' + helper + "</span>",
      "</div>",
      "</article>"
    ].join("");
  }

  function renderSpendDistribution() {
    var entries = categoryTotals();
    var total = entries.reduce(function sum(value, entry) {
      return value + entry.value;
    }, 0);
    var gradient = "";
    var start = 0;

    entries.forEach(function segment(entry) {
      var size = total ? (entry.value / total) * 100 : 0;
      gradient += entry.color + " " + start + "% " + (start + size) + "%, ";
      start += size;
    });

    gradient = gradient ? gradient.slice(0, -2) : "#e5e7eb 0% 100%";

    return [
      '<article class="panel spend-panel">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">Distribution</p>',
      "<h2>Where the money goes</h2>",
      "</div>",
      '<span class="panel-total">' + currency(total) + "/mo</span>",
      "</div>",
      '<div class="donut-layout">',
      '<div class="donut" style="background: conic-gradient(' + gradient + ')" role="img" aria-label="Category spend distribution by monthly spend"><div class="donut-center"><strong>' + spendPercent(entries[0] ? entries[0].value : 0, total) + '%</strong><span>Top spend</span></div></div>',
      '<div class="legend-list">',
      entries.length ? entries
        .map(function entry(item) {
          return '<div class="legend-row"><span class="legend-swatch" style="background:' + item.color + '"></span><span>' + item.shortLabel + '<small>' + spendPercent(item.value, total) + '% of monthly spend</small></span><strong>' + currency(item.value) + "</strong></div>";
        })
        .join("") : renderEmptyState("No spending categories yet.", "Add your first subscription to see category spend."),
      "</div>",
      "</div>",
      "</article>"
    ].join("");
  }

  function spendPercent(value, total) {
    return total ? Math.round((value / total) * 100) : 0;
  }

  function renderUpcomingCharges() {
    var upcoming = activeSubscriptions()
      .slice()
      .sort(function byDate(a, b) {
        return daysUntil(a.nextBillDate) - daysUntil(b.nextBillDate);
      })
      .slice(0, 5);

    return [
      '<article class="panel">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">Timeline</p>',
      "<h2>Upcoming renewals</h2>",
      "</div>",
      '<button class="ghost-button" data-action="navigate" data-view="alerts">Review alerts</button>',
      "</div>",
      '<div class="timeline-list">',
      upcoming.length ? upcoming.map(renderTimelineItem).join("") : renderEmptyState("No renewals tracked yet.", "Add a subscription to build your billing timeline."),
      "</div>",
      "</article>"
    ].join("");
  }

  function renderTimelineItem(subscription) {
    var meta = categoryMeta(subscription.category);
    var days = daysUntil(subscription.nextBillDate);
    return [
      '<div class="timeline-item">',
      '<span class="timeline-dot" style="background:' + meta.color + '"></span>',
      '<div>',
      '<strong>' + escapeHtml(subscription.name) + "</strong>",
      '<span>' + prettyDate(subscription.nextBillDate) + " · " + relativeDays(days) + "</span>",
      "</div>",
      '<b>' + currency(Number(subscription.price) || 0) + "</b>",
      "</div>"
    ].join("");
  }

  function renderRecommendationPreview(recommendations) {
    return [
      '<article class="panel">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">Savings</p>',
      "<h2>Top opportunities</h2>",
      "</div>",
      '<button class="ghost-button" data-action="navigate" data-view="savings">Open</button>',
      "</div>",
      recommendations.length ? recommendations.map(renderRecommendationItem).join("") : renderEmptyState("No recommendations yet.", "Mark a subscription as unused or add overlapping services to test the engine."),
      "</article>"
    ].join("");
  }

  function renderAlertPreview(alerts) {
    return [
      '<article class="panel">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">Protection</p>',
      "<h2>Alerts needing review</h2>",
      "</div>",
      '<button class="ghost-button" data-action="navigate" data-view="alerts">Open</button>',
      "</div>",
      alerts.length ? alerts.map(renderAlertItem).join("") : renderEmptyState("No alerts in the current window.", "Your trial and renewal thresholds are clear."),
      "</article>"
    ].join("");
  }

  function renderSubscriptionsView() {
    var filtered = filteredSubscriptions();
    return [
      '<section class="toolbar-panel">',
      '<div class="segmented-control" role="tablist" aria-label="Subscription filters">',
      ["all", "trial", "active", "unused", "dueSoon"].map(renderFilterButton).join(""),
      "</div>",
      '<button class="secondary-button" data-action="clear-local-data">' + icon("refresh") + "<span>Clear subscriptions</span></button>",
      "</section>",
      '<section class="subscription-list">',
      filtered.length ? filtered.map(renderSubscriptionCard).join("") : renderEmptyState("No subscriptions match this filter.", "Try another filter or add a new subscription."),
      "</section>"
    ].join("");
  }

  function renderFilterButton(filter) {
    var labels = {
      all: "All",
      trial: "Trials",
      active: "Active",
      unused: "Unused",
      dueSoon: "Due soon"
    };
    var active = state.filter === filter ? " is-active" : "";
    return '<button class="' + active + '" data-action="set-filter" data-filter="' + filter + '" role="tab">' + labels[filter] + "</button>";
  }

  function filteredSubscriptions() {
    return state.subscriptions.filter(function byFilter(subscription) {
      if (state.filter === "trial") {
        return subscription.status === "trial";
      }
      if (state.filter === "active") {
        return subscription.status === "active";
      }
      if (state.filter === "unused") {
        return subscription.usageStatus === "unused";
      }
      if (state.filter === "dueSoon") {
        var days = daysUntil(subscription.nextBillDate);
        return days >= 0 && days <= 7;
      }
      return true;
    });
  }

  function renderSubscriptionCard(subscription) {
    var meta = categoryMeta(subscription.category);
    var days = daysUntil(subscription.nextBillDate);
    return [
      '<article class="subscription-card">',
      '<div class="subscription-main">',
      '<span class="service-avatar" style="background:' + meta.softColor + '; color:' + meta.color + '">' + escapeHtml(subscription.name.charAt(0).toUpperCase()) + "</span>",
      '<div>',
      '<div class="service-title-row">',
      '<h2>' + escapeHtml(subscription.name) + "</h2>",
      '<span class="status-pill ' + subscription.status + '">' + labelize(subscription.status) + "</span>",
      renderServiceBadge(subscription),
      "</div>",
      '<p>' + meta.label + " · " + labelize(subscription.usageStatus) + " usage</p>",
      renderAccessPreview(subscription),
      "</div>",
      "</div>",
      '<div class="subscription-meta">',
      '<span><strong>' + currency(Number(subscription.price) || 0) + "</strong> " + subscription.interval + "</span>",
      '<span>Next bill: ' + prettyDate(subscription.nextBillDate) + " (" + relativeDays(days) + ")</span>",
      "</div>",
      '<div class="subscription-actions">',
      '<button class="secondary-button compact-action" title="Edit subscription" aria-label="Edit ' + escapeHtml(subscription.name) + '" data-action="open-form" data-id="' + subscription.id + '">' + icon("edit") + "<span>Edit</span></button>",
      '<button class="icon-button" title="Mark as unused" aria-label="Mark ' + escapeHtml(subscription.name) + ' as unused" data-action="mark-unused" data-id="' + subscription.id + '">' + icon("archive") + "</button>",
      '<button class="icon-button danger" title="Delete subscription" aria-label="Delete ' + escapeHtml(subscription.name) + '" data-action="delete-subscription" data-id="' + subscription.id + '">' + icon("trash") + "</button>",
      "</div>",
      "</article>"
    ].join("");
  }

  function renderServiceBadge(subscription) {
    var intelligence = subscription.serviceIntelligence || {};
    var recognized = intelligence.status === "recognized";
    return '<span class="service-badge ' + (recognized ? "recognized" : "unverified") + '">' + (recognized ? "Recognized" : "Unverified") + "</span>";
  }

  function renderAccessPreview(subscription) {
    var tags = serviceAccessTags(subscription).slice(0, 3);
    return [
      '<div class="access-preview">',
      '<span>' + escapeHtml(accessSummary(subscription)) + "</span>",
      '<div class="access-chip-list">',
      tags.map(function toChip(tag) {
        return '<span class="access-chip">' + escapeHtml(formatAccessTag(tag)) + "</span>";
      }).join(""),
      "</div>",
      "</div>"
    ].join("");
  }

  function renderAlertsView() {
    var alerts = buildAlerts();
    return [
      '<section class="wide-panel">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">72-hour guardrail</p>',
      "<h2>Alerts generated from your subscriptions</h2>",
      "</div>",
      '<button class="secondary-button" data-action="navigate" data-view="settings">' + icon("settings") + "<span>Adjust thresholds</span></button>",
      "</div>",
      alerts.length ? '<div class="alert-list">' + alerts.map(renderAlertItem).join("") + "</div>" : renderEmptyState("No alerts right now.", "Change the alert window in settings or add a subscription due soon."),
      "</section>"
    ].join("");
  }

  function renderAlertItem(alert) {
    return [
      '<div class="alert-item ' + alert.severity + '">',
      '<div class="alert-icon" aria-hidden="true">' + icon(alert.severity === "critical" ? "bell" : "calendar") + "</div>",
      '<div>',
      '<strong>' + alert.type + ": " + escapeHtml(alert.subscription.name) + "</strong>",
      '<span>' + alert.message + "</span>",
      "</div>",
      '<button class="ghost-button" data-action="open-form" data-id="' + alert.subscription.id + '">Edit</button>',
      "</div>"
    ].join("");
  }

  function renderSavingsView() {
    var leakage = leakageSummary();
    var recommendations = buildRecommendations();
    return [
      '<section class="kpi-grid savings-kpis">',
      renderKpi("Unused leakage", currency(leakage.unusedMonthly), "Marked unused but still active", "archive"),
      renderKpi("Partial-use leakage", currency(leakage.occasionalMonthly), "Estimated from occasional usage", "chart"),
      renderKpi("Overlap leakage", currency(leakage.redundancyMonthly), "Duplicate access coverage", "spark"),
      renderKpi("Total opportunity", currency(leakage.totalMonthly), currency(leakage.totalMonthly * 12) + " annual estimate", "wallet"),
      "</section>",
      '<section class="wide-panel">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">Recommendation engine</p>',
      "<h2>Explainable savings suggestions</h2>",
      "</div>",
      '<span class="formula-chip">L = unused days x price + overlap</span>',
      "</div>",
      recommendations.length ? '<div class="recommendation-list">' + recommendations.map(renderRecommendationItem).join("") + "</div>" : renderEmptyState("No savings suggestions yet.", "Add overlapping services or mark a subscription as unused."),
      "</section>"
    ].join("");
  }

  function renderRecommendationItem(recommendation) {
    return [
      '<div class="recommendation-item">',
      '<div>',
      '<span class="recommendation-type">' + recommendation.type + "</span>",
      '<strong>' + escapeHtml(recommendation.title) + "</strong>",
      '<p>' + escapeHtml(recommendation.reason) + "</p>",
      "</div>",
      '<div class="recommendation-value">',
      '<strong>' + currency(recommendation.estimatedMonthlySavings) + "/mo</strong>",
      '<span>' + recommendation.confidence + " confidence</span>",
      "</div>",
      "</div>"
    ].join("");
  }

  function renderSettingsView() {
    return [
      '<section class="settings-layout">',
      '<form class="settings-form panel" data-form="settings">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">Preferences</p>',
      "<h2>Alert thresholds</h2>",
      "</div>",
      "</div>",
      '<label>Renewal alert window, hours<input name="renewalWindowHours" type="number" min="24" step="24" value="' + state.preferences.renewalWindowHours + '"></label>',
      '<label>Annual renewal warning, days<input name="annualWarningDays" type="number" min="1" step="1" value="' + state.preferences.annualWarningDays + '"></label>',
      '<label>High-cost threshold<input name="highCostThreshold" type="number" min="1" step="1" value="' + state.preferences.highCostThreshold + '"></label>',
      '<button class="primary-button" type="submit">' + icon("check") + "<span>Save settings</span></button>",
      "</form>",
      '<article class="panel">',
      '<div class="section-heading">',
      "<div>",
      '<p class="eyebrow">Data</p>',
      "<h2>Local MVP storage</h2>",
      "</div>",
      "</div>",
      '<p class="body-copy">This Phase 1 build stores local accounts, subscriptions, and settings in this browser only. Phase 2 should move auth and records into Supabase and connect Plaid transaction sync.</p>',
      '<div class="settings-actions">',
      '<button class="secondary-button" data-action="export-data">' + icon("download") + "<span>Export JSON</span></button>",
      '<button class="danger-button" data-action="clear-local-data">' + icon("refresh") + "<span>Clear local data</span></button>",
      "</div>",
      "</article>",
      "</section>"
    ].join("");
  }

  function renderEmptyState(title, body) {
    return '<div class="empty-state"><strong>' + title + "</strong><span>" + body + "</span></div>";
  }

  function openSubscriptionForm(id) {
    var existing = id ? state.subscriptions.find(function find(subscription) {
      return subscription.id === id;
    }) : null;

    var subscription = existing || {
      id: "",
      name: "",
      merchantName: "",
      category: "streaming",
      price: "",
      interval: "monthly",
      nextBillDate: dateToInput(7),
      trialEndsAt: "",
      status: "active",
      usageStatus: "unknown",
      isEssential: false,
      managementUrl: "",
      notes: ""
    };
    var intelligence = subscription.serviceIntelligence || buildServiceIntelligence(subscription.name, subscription.category, subscription.accessNotes || subscription.notes || "");
    var accessNotes = subscription.accessNotes || intelligence.accessSummary || "";

    modalRoot.innerHTML = [
      '<div class="modal-backdrop" data-action="close-modal"></div>',
      '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="subscription-form-title">',
      '<form data-form="subscription" data-existing="' + String(Boolean(existing)) + '">',
      '<div class="modal-header">',
      '<div>',
      '<p class="eyebrow">' + (existing ? "Edit record" : "New record") + "</p>",
      '<h2 id="subscription-form-title">' + (existing ? "Edit subscription" : "Add subscription") + "</h2>",
      "</div>",
      '<button class="icon-button" type="button" title="Close" aria-label="Close form" data-action="close-modal">' + icon("x") + "</button>",
      "</div>",
      '<input type="hidden" name="id" value="' + escapeAttr(subscription.id) + '">',
      '<div class="form-grid">',
      '<label>Service name<input name="name" required data-role="service-name" value="' + escapeAttr(subscription.name) + '" placeholder="Netflix, Microsoft 365, Dropbox"></label>',
      '<label>Merchant<input name="merchantName" value="' + escapeAttr(subscription.merchantName || "") + '" placeholder="Billing merchant"></label>',
      '<label>Category<select name="category">' + renderCategoryOptions(subscription.category) + "</select></label>",
      '<label>Price<input name="price" required type="number" min="0" step="0.01" value="' + escapeAttr(subscription.price) + '"></label>',
      '<label>Billing cadence<select name="interval">' + renderOptions(["monthly", "annual"], subscription.interval) + "</select></label>",
      '<label>Next billing date<input name="nextBillDate" required type="date" value="' + escapeAttr(subscription.nextBillDate) + '"></label>',
      '<label>Status<select name="status">' + renderOptions(["active", "trial", "paused"], subscription.status) + "</select></label>",
      '<label>Usage<select name="usageStatus">' + renderOptions(["active", "occasional", "unused", "unknown"], subscription.usageStatus) + "</select></label>",
      '<label>Trial ends<input name="trialEndsAt" type="date" value="' + escapeAttr(subscription.trialEndsAt || "") + '"></label>',
      '<label>Management URL<input name="managementUrl" type="url" value="' + escapeAttr(subscription.managementUrl || "") + '" placeholder="https://"></label>',
      "</div>",
      '<div class="service-insight" data-service-insight>' + renderServiceInsight(subscription.name, subscription.category, accessNotes) + "</div>",
      '<label>Access / features<textarea name="accessNotes" data-role="access-notes" rows="3" placeholder="Video streaming, cloud storage, office apps, password manager">' + escapeHtml(accessNotes) + "</textarea></label>",
      '<label class="checkbox-row"><input name="isEssential" type="checkbox" ' + (subscription.isEssential ? "checked" : "") + "> Mark as essential</label>",
      '<label>Notes<textarea name="notes" rows="3" placeholder="Usage notes or cancellation steps">' + escapeHtml(subscription.notes || "") + "</textarea></label>",
      '<div class="modal-actions">',
      '<button class="secondary-button" type="button" data-action="close-modal">Cancel</button>',
      '<button class="primary-button" type="submit">' + icon("check") + "<span>" + (existing ? "Save changes" : "Save subscription") + "</span></button>",
      "</div>",
      "</form>",
      "</section>"
    ].join("");

    var firstInput = modalRoot.querySelector("input[name='name']");
    if (firstInput) {
      firstInput.focus();
    }
    var form = modalRoot.querySelector("form[data-form='subscription']");
    if (form) {
      updateServiceInsightInForm(form, false);
    }
  }

  function renderServiceInsight(name, category, accessNotes) {
    var match = matchServiceCatalog(name);
    if (match) {
      var service = match.service;
      return [
        '<div class="service-insight-icon" aria-hidden="true">' + icon("search-check") + "</div>",
        "<div>",
        '<strong>Recognized as ' + escapeHtml(service.canonicalName) + "</strong>",
        '<p>' + escapeHtml(service.accessSummary) + "</p>",
        '<div class="access-chip-list">',
        (service.accessTags || []).slice(0, 6).map(function toChip(tag) {
          return '<span class="access-chip">' + escapeHtml(formatAccessTag(tag)) + "</span>";
        }).join(""),
        "</div>",
        "</div>"
      ].join("");
    }

    return [
      '<div class="service-insight-icon unverified" aria-hidden="true">' + icon("search") + "</div>",
      "<div>",
      "<strong>" + (name ? "Service not found in the local catalog" : "Enter a service name to check it") + "</strong>",
      '<p>' + (accessNotes ? "Manual access details will be used for redundancy checks." : "Add access/features to help SubCheck detect overlaps for unverified services.") + "</p>",
      '<div class="access-chip-list">',
      parseAccessTags(accessNotes).slice(0, 6).map(function toChip(tag) {
        return '<span class="access-chip">' + escapeHtml(formatAccessTag(tag)) + "</span>";
      }).join(""),
      "</div>",
      "</div>"
    ].join("");
  }

  function updateServiceInsightInForm(form, shouldAutofill) {
    var nameInput = form.querySelector("[data-role='service-name']");
    var accessInput = form.querySelector("[data-role='access-notes']");
    var merchantInput = form.querySelector("input[name='merchantName']");
    var categoryInput = form.querySelector("select[name='category']");
    var urlInput = form.querySelector("input[name='managementUrl']");
    var insight = form.querySelector("[data-service-insight]");
    var name = nameInput ? nameInput.value : "";
    var accessNotes = accessInput ? accessInput.value : "";
    var match = matchServiceCatalog(name);
    var isExisting = form.getAttribute("data-existing") === "true";

    if (match && shouldAutofill) {
      var service = match.service;
      if (categoryInput && !isExisting) {
        categoryInput.value = service.category;
      }
      if (merchantInput && !merchantInput.value.trim()) {
        merchantInput.value = service.merchantName || service.canonicalName;
      }
      if (urlInput && !urlInput.value.trim()) {
        urlInput.value = service.homepage || "";
      }
      if (accessInput && (!accessInput.value.trim() || accessInput.getAttribute("data-auto-filled") === "true")) {
        accessInput.value = service.accessSummary || "";
        accessInput.setAttribute("data-auto-filled", "true");
        accessNotes = accessInput.value;
      }
    }

    if (insight) {
      insight.innerHTML = renderServiceInsight(name, categoryInput ? categoryInput.value : "utilities", accessNotes);
    }
  }

  function renderCategoryOptions(selected) {
    return Object.keys(seed.categories)
      .map(function option(category) {
        var active = category === selected ? " selected" : "";
        return '<option value="' + category + '"' + active + ">" + seed.categories[category].label + "</option>";
      })
      .join("");
  }

  function renderOptions(options, selected) {
    return options
      .map(function option(value) {
        var active = value === selected ? " selected" : "";
        return '<option value="' + value + '"' + active + ">" + labelize(value) + "</option>";
      })
      .join("");
  }

  function dateToInput(offsetDays) {
    var date = today();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  }

  function closeModal() {
    modalRoot.innerHTML = "";
  }

  function saveSubscription(form) {
    var formData = new FormData(form);
    var id = formData.get("id") || createId();
    var existing = state.subscriptions.find(function find(item) {
      return item.id === id;
    });
    var rawName = String(formData.get("name") || "").trim();
    var accessNotes = String(formData.get("accessNotes") || "").trim();
    var matchedService = matchServiceCatalog(rawName);
    var category = matchedService && !existing ? matchedService.service.category : String(formData.get("category"));
    var serviceIntelligence = buildServiceIntelligence(rawName, category, accessNotes);
    var subscription = {
      id: String(id),
      name: serviceIntelligence.canonicalName || rawName,
      merchantName: String(formData.get("merchantName") || serviceIntelligence.merchantName || serviceIntelligence.canonicalName || "").trim(),
      category: category,
      price: Number(formData.get("price")) || 0,
      interval: String(formData.get("interval")),
      nextBillDate: String(formData.get("nextBillDate")),
      trialEndsAt: String(formData.get("trialEndsAt") || ""),
      status: String(formData.get("status")),
      usageStatus: String(formData.get("usageStatus")),
      isEssential: formData.get("isEssential") === "on",
      managementUrl: String(formData.get("managementUrl") || serviceIntelligence.homepage || "").trim(),
      accessNotes: serviceIntelligence.accessSummary,
      serviceIntelligence: serviceIntelligence,
      notes: String(formData.get("notes") || "").trim()
    };

    var index = state.subscriptions.findIndex(function findIndex(item) {
      return item.id === id;
    });

    if (index >= 0) {
      state.subscriptions[index] = subscription;
    } else {
      state.subscriptions.push(subscription);
    }

    saveSubscriptions();
    closeModal();
    render();
  }

  async function handleAuthSubmit(form) {
    var formData = new FormData(form);
    var mode = String(formData.get("mode") || state.authMode);
    var name = String(formData.get("name") || "").trim();
    var email = normalizeEmail(formData.get("email"));
    var password = String(formData.get("password") || "");
    var users = loadUsers();

    if (!email || !password) {
      showAuthError("Enter an email address and password.");
      return;
    }

    if (password.length < 8) {
      showAuthError("Use at least 8 characters for your password.");
      return;
    }

    if (mode === "signin") {
      var existing = users.find(function byEmail(user) {
        return user.email === email;
      });

      if (!existing) {
        showAuthError("No SubCheck account was found for that email.");
        return;
      }

      var attemptedHash = await hashPassword(password, existing.salt);
      if (attemptedHash !== existing.passwordHash) {
        showAuthError("That password does not match this account.");
        return;
      }

      state.authError = "";
      setCurrentUser(existing);
      render();
      return;
    }

    if (!name) {
      showAuthError("Enter your name to create an account.");
      return;
    }

    var duplicate = users.some(function byEmail(user) {
      return user.email === email;
    });

    if (duplicate) {
      state.authMode = "signin";
      showAuthError("An account already exists for that email. Sign in instead.");
      return;
    }

    var salt = createSalt();
    var user = {
      id: "user-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      name: name,
      email: email,
      salt: salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);
    state.authError = "";
    setCurrentUser(user);
    saveSubscriptions();
    savePreferences();
    render();
  }

  function showAuthError(message) {
    state.authError = message;
    render();
  }

  function createId() {
    return "sub-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
  }

  function saveSettings(form) {
    var formData = new FormData(form);
    state.preferences.renewalWindowHours = Number(formData.get("renewalWindowHours")) || 72;
    state.preferences.annualWarningDays = Number(formData.get("annualWarningDays")) || 14;
    state.preferences.highCostThreshold = Number(formData.get("highCostThreshold")) || 25;
    savePreferences();
    render();
  }

  function deleteSubscription(id) {
    var subscription = state.subscriptions.find(function find(item) {
      return item.id === id;
    });

    if (!subscription) {
      return;
    }

    if (!window.confirm("Delete " + subscription.name + " from SubCheck?")) {
      return;
    }

    state.subscriptions = state.subscriptions.filter(function remove(item) {
      return item.id !== id;
    });
    saveSubscriptions();
    render();
  }

  function markUnused(id) {
    state.subscriptions = state.subscriptions.map(function update(subscription) {
      if (subscription.id === id) {
        return Object.assign({}, subscription, { usageStatus: "unused" });
      }
      return subscription;
    });
    saveSubscriptions();
    render();
  }

  function clearLocalData() {
    if (!window.confirm("Clear all subscriptions and reset settings for this local account?")) {
      return;
    }

    state.subscriptions = clone(seed.subscriptions);
    state.preferences = clone(seed.preferences);
    saveSubscriptions();
    savePreferences();
    render();
  }

  function exportData() {
    var payload = {
      exportedAt: new Date().toISOString(),
      user: state.currentUser,
      preferences: state.preferences,
      subscriptions: state.subscriptions
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "subcheck-export.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleClick(event) {
    var target = event.target.closest("[data-action]");
    if (!target) {
      return;
    }

    var action = target.getAttribute("data-action");
    var id = target.getAttribute("data-id");

    if (action === "set-auth-mode") {
      state.authMode = target.getAttribute("data-mode") || "signup";
      state.authError = "";
      render();
      return;
    }

    if (!state.currentUser) {
      return;
    }

    if (action === "navigate") {
      state.view = target.getAttribute("data-view") || "dashboard";
      render();
    }

    if (action === "set-filter") {
      state.filter = target.getAttribute("data-filter") || "all";
      render();
    }

    if (action === "open-form") {
      openSubscriptionForm(id);
    }

    if (action === "close-modal") {
      closeModal();
    }

    if (action === "delete-subscription") {
      deleteSubscription(id);
    }

    if (action === "mark-unused") {
      markUnused(id);
    }

    if (action === "clear-local-data") {
      clearLocalData();
    }

    if (action === "export-data") {
      exportData();
    }

    if (action === "sign-out") {
      clearSession();
      render();
    }
  }

  function handleInput(event) {
    var target = event.target;
    if (!target.matches("[data-role='service-name'], [data-role='access-notes']")) {
      return;
    }

    var form = target.closest("form[data-form='subscription']");
    if (!form) {
      return;
    }

    if (target.matches("[data-role='access-notes']")) {
      target.setAttribute("data-auto-filled", "false");
    }

    updateServiceInsightInForm(form, target.matches("[data-role='service-name']"));
  }

  async function handleSubmit(event) {
    var form = event.target;
    if (!form.matches("[data-form]")) {
      return;
    }

    event.preventDefault();

    if (form.getAttribute("data-form") === "auth") {
      await handleAuthSubmit(form);
      return;
    }

    if (!state.currentUser) {
      return;
    }

    if (form.getAttribute("data-form") === "subscription") {
      saveSubscription(form);
    }

    if (form.getAttribute("data-form") === "settings") {
      saveSettings(form);
    }
  }

  function labelize(value) {
    return String(value || "")
      .replace(/([A-Z])/g, " $1")
      .replace(/[-_]/g, " ")
      .replace(/^./, function capitalize(match) {
        return match.toUpperCase();
      });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function icon(name) {
    var icons = {
      archive: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v13H4z"></path><path d="M3 4h18v3H3z"></path><path d="M9 11h6"></path></svg>',
      bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M10 21h4"></path></svg>',
      calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v15H4z"></path><path d="M8 3v4"></path><path d="M16 3v4"></path><path d="M4 10h16"></path></svg>',
      card: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z"></path><path d="M3 10h18"></path><path d="M7 15h3"></path></svg>',
      chart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5"></path><path d="M4 19h16"></path><path d="M8 16v-5"></path><path d="M12 16V8"></path><path d="M16 16v-3"></path></svg>',
      check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>',
      download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 20h14"></path></svg>',
      edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="m13 7 4 4"></path></svg>',
      layout: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"></path><path d="M4 10h16"></path><path d="M10 10v9"></path></svg>',
      "log-out": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5"></path><path d="M15 12H3"></path><path d="M21 4v16"></path></svg>',
      plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
      refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7"></path><path d="M20 4v6h-6"></path></svg>',
      search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path></svg>',
      "search-check": '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4"></path><path d="m8 11 2 2 4-4"></path></svg>',
      settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8"></path><path d="M4 12h2"></path><path d="M18 12h2"></path><path d="M12 4v2"></path><path d="M12 18v2"></path><path d="m6.3 6.3 1.4 1.4"></path><path d="m16.3 16.3 1.4 1.4"></path><path d="m17.7 6.3-1.4 1.4"></path><path d="m7.7 16.3-1.4 1.4"></path></svg>',
      shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"></path><path d="m9 12 2 2 4-5"></path></svg>',
      spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 6.8H21l-5.5 4 2.1 6.7-5.6-4.1-5.6 4.1 2.1-6.7-5.5-4h6.8z"></path></svg>',
      trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 13h8l1-13"></path></svg>',
      user: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8"></path><path d="M4 21a8 8 0 0 1 16 0"></path></svg>',
      "user-plus": '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8"></path><path d="M4 21a8 8 0 0 1 10-7.7"></path><path d="M18 15v6"></path><path d="M15 18h6"></path></svg>',
      wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v12H4z"></path><path d="M16 11h4v4h-4z"></path><path d="M4 7l3-3h11"></path></svg>',
      x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12"></path><path d="M18 6 6 18"></path></svg>'
    };
    return icons[name] || icons.spark;
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("input", handleInput);
  document.addEventListener("submit", handleSubmit);
  render();
})();
