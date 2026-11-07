<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## XmasMagic PH architecture
- Customers never sign in; orders are created and read only through server functions in `src/lib/api/orders.functions.ts` using a secret per-order access token — keeps photos private without customer accounts.
- Server functions live in `src/lib/api/*.functions.ts`; server-only helpers live in `src/server/*.server.ts` and are imported dynamically inside handlers — the `src/server` folder is blocked from client bundles.
- Storage buckets are private (`order-photos`, `site-media`); browsers only get short-lived signed URLs — workspace blocks public buckets.
- Prices are always read from `app_settings` on the server when creating an order — never trust client prices.
- Orders move to Payment Verified only by an admin; AI generation runs one style per server call from the admin dashboard — avoids worker timeouts.
- The first account to sign up becomes admin (trigger `handle_first_admin`); roles live in `user_roles`.
- The homepage Christmas studio presentation lives in a dedicated section and reads the shared catalog and site settings, so visual redesigns do not change checkout rules.
- Checkout uses a gated photo/template/payment sequence; the stored template is generated first, followed by the remaining catalog styles, so every order still includes five photos.
- Generation and retries require a stored admin payment-verification timestamp, not just a failed/processing status, to prevent unpaid generation.
- Photo editing uses the saved Gemini key (Google key only when Gemini is unset), with no automatic provider fallback or replay — honors the owner's provider choice without duplicating billed work.
