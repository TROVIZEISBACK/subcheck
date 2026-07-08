# SubCheck Implementation Plan

## Project Definition

SubCheck is a subscription management and spend optimization product. It helps users identify recurring charges, avoid forgotten trials, detect redundant subscriptions, and act before billing events happen.

The presentation defines the product as a centralized financial control layer for subscription spending. The Phase 1 implementation in this repository focuses on the hackathon MVP: manual entry, dashboard visualization, renewal alerts, and explainable savings logic.

## Delivery Strategy

| Phase | Goal | Primary Outcome |
| --- | --- | --- |
| Phase 1: Hackathon MVP | Manual subscription tracking and visualization | A working dashboard users can demo and use immediately |
| Phase 2: Beta Sync | Plaid-backed transaction import | Automatic subscription detection and renewal tracking |
| Phase 3: Smart Engine | Redundancy and savings suggestions | Actionable optimization recommendations |
| Phase 4: Scaling | Provider actions and cancellation support | One-click or guided cancellation and retention workflows |

## Phase 1 Scope

Phase 1 should prove the core user experience without requiring bank connectivity or backend credentials. The user can add subscriptions manually, understand monthly spend, see upcoming renewals, receive trial warnings, and review savings recommendations.

### Implemented in this repository

- Manual subscription add, edit, delete, and usage classification.
- Browser-local persistence through `localStorage`.
- Dashboard KPIs for monthly spend, annual spend, upcoming charges, alerts, and savings opportunity.
- Category distribution chart.
- Upcoming renewal timeline.
- Alert center for trials, renewals, annual plans, and high-cost charges.
- Savings recommendations for unused subscriptions, occasional-use subscriptions, trial conversion risk, and redundant category overlap.
- Settings for renewal windows, annual warning windows, and high-cost thresholds.
- JSON export for handoff or demo analysis.

### Phase 1 acceptance criteria

- A user can open the app and use it without setup.
- A user can add, edit, and delete subscriptions.
- Dashboard totals update after every change.
- Users can see subscriptions due within the next 30 days.
- Trial subscriptions can trigger a visible 72-hour warning state.
- The recommendation engine explains each savings suggestion.

## Phase 2: Plaid and Supabase

Phase 2 should convert the local MVP into a connected product.

### Backend

- Add Supabase Auth for user accounts.
- Add Supabase Postgres tables for users, subscriptions, transactions, alerts, recommendations, and Plaid connections.
- Enforce row-level security on user-owned records.
- Move calculation logic into shared client/server modules so dashboard and API results match.

### Plaid integration

- Create Plaid Link tokens server-side.
- Exchange public tokens for access tokens server-side.
- Store access tokens encrypted.
- Import transactions on demand and through webhooks.
- Detect recurring charges by merchant, amount, cadence, and transaction history.
- Let users accept, dismiss, merge, or edit detected subscriptions.

## Phase 3: Smart Engine

The recommendation engine should start deterministic and become smarter over time.

### Initial scoring model

```text
leakage = sum(unused_days * daily_price) + redundant_overlap_score
```

### Recommendation types

- Cancel unused subscription.
- Downgrade occasional-use subscription.
- Review trial before conversion.
- Resolve category overlap.
- Review high-cost annual renewal.

Every recommendation should include a reason, estimated savings, confidence, and user feedback state.

## Phase 4: Cancellation and Scale

Phase 4 should turn insight into action.

- Add provider-specific management links.
- Add guided cancellation steps for known merchants.
- Add direct cancellation integrations where available.
- Add mobile push notifications.
- Add household/shared subscription spaces.
- Track action outcomes: cancelled, downgraded, kept, ignored.

## Proposed Data Model

### users

- `id`
- `email`
- `timezone`
- `notification_preferences`

### subscriptions

- `id`
- `user_id`
- `name`
- `merchant_name`
- `category`
- `price`
- `currency`
- `billing_interval`
- `next_bill_date`
- `trial_ends_at`
- `status`
- `usage_status`
- `is_essential`
- `source`
- `management_url`
- `notes`
- `created_at`
- `updated_at`

### transactions

- `id`
- `user_id`
- `plaid_transaction_id`
- `merchant_name`
- `amount`
- `date`
- `category`
- `account_id`
- `subscription_id`

### alerts

- `id`
- `user_id`
- `subscription_id`
- `alert_type`
- `scheduled_for`
- `sent_at`
- `status`

### recommendations

- `id`
- `user_id`
- `subscription_id`
- `recommendation_type`
- `estimated_savings`
- `reason`
- `confidence`
- `status`
- `created_at`

### plaid_connections

- `id`
- `user_id`
- `institution_name`
- `access_token_encrypted`
- `item_id`
- `status`
- `last_synced_at`

## API Surface for Phase 2

- `GET /me`
- `PATCH /me/preferences`
- `GET /subscriptions`
- `POST /subscriptions`
- `GET /subscriptions/:id`
- `PATCH /subscriptions/:id`
- `DELETE /subscriptions/:id`
- `GET /dashboard/summary`
- `GET /dashboard/spend-distribution`
- `GET /dashboard/upcoming-renewals`
- `GET /dashboard/leakage`
- `GET /alerts`
- `PATCH /alerts/:id`
- `GET /recommendations`
- `POST /recommendations/:id/feedback`
- `POST /plaid/link-token`
- `POST /plaid/exchange-public-token`
- `POST /plaid/sync`
- `POST /plaid/webhook`
- `GET /plaid/connections`

## Security Requirements

- Never expose Plaid access tokens to the browser.
- Encrypt integration tokens at rest.
- Apply row-level security to all user-owned data.
- Minimize stored transaction details.
- Provide delete-account and delete-bank-connection flows.
- Log sensitive operations without storing sensitive payloads.

## Launch Metrics

- Monthly recurring spend tracked per user.
- Number of active subscriptions added or detected.
- Alert review rate.
- Trial conversions avoided.
- Recommendations accepted.
- Estimated monthly savings.
- Plaid connection completion rate.
- Subscription detection precision after user review.

## Phase 1 Definition of Done

The MVP is complete when a user can open the app, add at least five subscriptions, see monthly spend distribution, identify upcoming renewals, receive visible trial or renewal warnings, and view at least one savings recommendation with a clear reason.

