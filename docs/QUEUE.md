# What's queued

Agreed, not built. Newest at the top of each section. Plain language on
purpose — this is the list Abdul works from, not a ticket tracker.

---

## Next up

### 1. Switching APP type must go through pausing the store

**Where:** the top header, where *Change APP type* already sits.

**The rule:** a store that is open cannot change type. To switch, the merchant
pauses their store first; only then is the type switch offered.

**Why:** switching type changes what a merchant is expected to upload — a shop
fills in products, variants, stock and shipping. Letting someone switch while
the store is live invites them to fill in a catalogue for a business they are
about to stop being. Pausing first makes the switch a deliberate act.

**The flow:**

1. Merchant opens *Change APP type* in the top header.
2. If the store is `ACTIVE`, `TRIAL` or `PAST_DUE`, the dialog does not offer
   the switch. It explains why, and offers **Pause my store** — the same action
   as Preferences › Visibility, not a second one.
3. Once the store is `PAUSED`, the dialog offers the types.
4. After switching, the merchant reopens the store themselves. It does not
   reopen on its own: they should see the new panel before customers do.

**Notes for whoever builds it**

- `PAUSED` is the existing status and `pauseStore()` in
  `app/admin/settings/lifecycle-actions.ts` is the existing action. Do not add
  a second idea of "inactive".
- `SUSPENDED` and `CLOSED` are ours and the merchant's endings respectively —
  neither should offer a type switch at all.
- The switch itself destroys nothing: storefront rows are partitioned by type,
  so switching back brings the old one straight back.
- The control is currently `xl:` only. It needs to be reachable on a laptop.

### 2. AHAD1V is still a RESTAURANT row in the live database

It renders the e-commerce panel correctly, but the row is wrong. Fixed by:

```
npx tsx scripts/seed-demo.ts --shop ahad1v --set-type ecommerce
```

---

## Agreed, waiting

- **Analytics**: real graphs and live figures, and its own action bar.
- **Action bars tailored per section** — each section's own actions, not a
  generic row.
- **Restaurant panel**: its own design. Different sections, different screens,
  its own naming. Opening hours, Locations and the food menu come back with it.
- **Blog panel**: same — Posts redirects until it exists.
- **Service business type**: named in the documentation, no design and no code.
- **Billing**, as a Settings tab.
- **Security & privacy** as its own Settings tab: login locations, an
  authenticator app, a recovery phone number.
- **Theme versions** (1.4.2) and an update-to-latest button.
- **Editable page addresses** for permanent pages, with the old one forwarding.
- **Default policy pages** — returns, privacy, terms.
- **"Direct me to the cause"** on every error that blocks an action.
- **The Data library as the picker** wherever a picture can be changed,
  including inside the live customizer.

---

## Known problems

- **`synora-shop-api`'s schema is ~99 lines behind this repo's.** Harmless
  while nothing deploys from it; a real failure the day something does.
- **Image upload does not work locally** — no `BLOB_READ_WRITE_TOKEN` in
  `.env`. Pasting a URL still works.
