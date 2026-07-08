(function runSubCheckApp() {
  var STORAGE_KEY = "subcheck.phase1.subscriptions";
  var PREFS_KEY = "subcheck.phase1.preferences";
  var seed = window.SubCheckSeed;
  var app = document.getElementById("app");
  var modalRoot = document.getElementById("modal-root");

  var state = {
    view: "dashboard",
    filter: "all",
    subscriptions: loadSubscriptions(),
    preferences: loadPreferences()
  };

  function loadSubscriptions() {
    var saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return clone(seed.subscriptions);
    }

    try {
      var parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : clone(seed.subscriptions);
    } catch (error) {
      return clone(seed.subscriptions);
    }
  }

  function loadPreferences() {
    var saved = window.localStorage.getItem(PREFS_KEY);
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
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.subscriptions));
  }

  function savePreferences() {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(state.preferences));
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
    var grouped = {};

    activeSubscriptions().forEach(function group(subscription) {
      if (!grouped[subscription.category]) {
        grouped[subscription.category] = [];
      }
      grouped[subscription.category].push(subscription);
    });

    return Object.keys(grouped)
      .map(function toRedundantGroup(category) {
        var subscriptions = grouped[category];
        if (subscriptions.length < 2) {
          return null;
        }

        var sorted = subscriptions.slice().sort(function byPriority(a, b) {
          if (a.isEssential !== b.isEssential) {
            return a.isEssential ? -1 : 1;
          }
          return monthlyCost(b) - monthlyCost(a);
        });
        var keep = sorted[0];
        var review = sorted.slice(1);
        var savings = review.reduce(function sum(total, subscription) {
          var factor = subscription.usageStatus === "unused" ? 1 : 0.45;
          return total + monthlyCost(subscription) * factor;
        }, 0);

        return {
          category: category,
          label: categoryMeta(category).label,
          keep: keep,
          review: review,
          estimatedMonthlySavings: savings
        };
      })
      .filter(Boolean);
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
        id: group.category + "-redundancy",
        title: "Resolve overlap in " + group.label,
        type: "Redundant overlap",
        estimatedMonthlySavings: group.estimatedMonthlySavings,
        confidence: "Medium",
        subscriptionIds: group.review.map(function toId(subscription) {
          return subscription.id;
        }),
        reason: "Keep " + group.keep.name + " as the primary option and review " + group.review.map(function toName(subscription) {
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
      settings: "Local demo settings"
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
      '<div class="donut" style="background: conic-gradient(' + gradient + ')" role="img" aria-label="Category spend distribution"><span>' + Math.round(total ? (entries[0].value / total) * 100 : 0) + '%</span></div>',
      '<div class="legend-list">',
      entries
        .map(function entry(item) {
          return '<div class="legend-row"><span class="legend-swatch" style="background:' + item.color + '"></span><span>' + item.shortLabel + '</span><strong>' + currency(item.value) + "</strong></div>";
        })
        .join(""),
      "</div>",
      "</div>",
      "</article>"
    ].join("");
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
      upcoming.map(renderTimelineItem).join(""),
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
      '<button class="secondary-button" data-action="reset-demo">' + icon("refresh") + "<span>Reset demo data</span></button>",
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
      "</div>",
      '<p>' + meta.label + " · " + labelize(subscription.usageStatus) + " usage</p>",
      "</div>",
      "</div>",
      '<div class="subscription-meta">',
      '<span><strong>' + currency(Number(subscription.price) || 0) + "</strong> " + subscription.interval + "</span>",
      '<span>Next bill: ' + prettyDate(subscription.nextBillDate) + " (" + relativeDays(days) + ")</span>",
      "</div>",
      '<div class="subscription-actions">',
      '<button class="icon-button" title="Edit subscription" aria-label="Edit ' + escapeHtml(subscription.name) + '" data-action="open-form" data-id="' + subscription.id + '">' + icon("edit") + "</button>",
      '<button class="icon-button" title="Mark as unused" aria-label="Mark ' + escapeHtml(subscription.name) + ' as unused" data-action="mark-unused" data-id="' + subscription.id + '">' + icon("archive") + "</button>",
      '<button class="icon-button danger" title="Delete subscription" aria-label="Delete ' + escapeHtml(subscription.name) + '" data-action="delete-subscription" data-id="' + subscription.id + '">' + icon("trash") + "</button>",
      "</div>",
      "</article>"
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
      renderKpi("Overlap leakage", currency(leakage.redundancyMonthly), "Duplicate category coverage", "spark"),
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
      '<p class="body-copy">This Phase 1 build stores subscriptions in this browser only. Phase 2 should move the same records into Supabase and connect Plaid transaction sync.</p>',
      '<div class="settings-actions">',
      '<button class="secondary-button" data-action="export-data">' + icon("download") + "<span>Export JSON</span></button>",
      '<button class="danger-button" data-action="reset-demo">' + icon("refresh") + "<span>Reset demo</span></button>",
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

    modalRoot.innerHTML = [
      '<div class="modal-backdrop" data-action="close-modal"></div>',
      '<section class="modal" role="dialog" aria-modal="true" aria-labelledby="subscription-form-title">',
      '<form data-form="subscription">',
      '<div class="modal-header">',
      '<div>',
      '<p class="eyebrow">' + (existing ? "Edit record" : "New record") + "</p>",
      '<h2 id="subscription-form-title">' + (existing ? "Edit subscription" : "Add subscription") + "</h2>",
      "</div>",
      '<button class="icon-button" type="button" title="Close" aria-label="Close form" data-action="close-modal">' + icon("x") + "</button>",
      "</div>",
      '<input type="hidden" name="id" value="' + escapeAttr(subscription.id) + '">',
      '<div class="form-grid">',
      '<label>Service name<input name="name" required value="' + escapeAttr(subscription.name) + '" placeholder="Spotify"></label>',
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
      '<label class="checkbox-row"><input name="isEssential" type="checkbox" ' + (subscription.isEssential ? "checked" : "") + "> Mark as essential</label>",
      '<label>Notes<textarea name="notes" rows="3" placeholder="Usage notes or cancellation steps">' + escapeHtml(subscription.notes || "") + "</textarea></label>",
      '<div class="modal-actions">',
      '<button class="secondary-button" type="button" data-action="close-modal">Cancel</button>',
      '<button class="primary-button" type="submit">' + icon("check") + "<span>Save subscription</span></button>",
      "</div>",
      "</form>",
      "</section>"
    ].join("");

    var firstInput = modalRoot.querySelector("input[name='name']");
    if (firstInput) {
      firstInput.focus();
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
    var subscription = {
      id: String(id),
      name: String(formData.get("name") || "").trim(),
      merchantName: String(formData.get("merchantName") || "").trim(),
      category: String(formData.get("category")),
      price: Number(formData.get("price")) || 0,
      interval: String(formData.get("interval")),
      nextBillDate: String(formData.get("nextBillDate")),
      trialEndsAt: String(formData.get("trialEndsAt") || ""),
      status: String(formData.get("status")),
      usageStatus: String(formData.get("usageStatus")),
      isEssential: formData.get("isEssential") === "on",
      managementUrl: String(formData.get("managementUrl") || "").trim(),
      notes: String(formData.get("notes") || "").trim()
    };

    var index = state.subscriptions.findIndex(function find(item) {
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

  function resetDemoData() {
    if (!window.confirm("Reset all local SubCheck data to the demo set?")) {
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

    if (action === "reset-demo") {
      resetDemoData();
    }

    if (action === "export-data") {
      exportData();
    }
  }

  function handleSubmit(event) {
    var form = event.target;
    if (!form.matches("[data-form]")) {
      return;
    }

    event.preventDefault();

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
      plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg>',
      refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.4-5.7"></path><path d="M20 4v6h-6"></path></svg>',
      settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8"></path><path d="M4 12h2"></path><path d="M18 12h2"></path><path d="M12 4v2"></path><path d="M12 18v2"></path><path d="m6.3 6.3 1.4 1.4"></path><path d="m16.3 16.3 1.4 1.4"></path><path d="m17.7 6.3-1.4 1.4"></path><path d="m7.7 16.3-1.4 1.4"></path></svg>',
      spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 6.8H21l-5.5 4 2.1 6.7-5.6-4.1-5.6 4.1 2.1-6.7-5.5-4h6.8z"></path></svg>',
      trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16"></path><path d="M9 7V4h6v3"></path><path d="M7 7l1 13h8l1-13"></path></svg>',
      wallet: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v12H4z"></path><path d="M16 11h4v4h-4z"></path><path d="M4 7l3-3h11"></path></svg>',
      x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12"></path><path d="M18 6 6 18"></path></svg>'
    };
    return icons[name] || icons.spark;
  }

  document.addEventListener("click", handleClick);
  document.addEventListener("submit", handleSubmit);
  render();
})();

