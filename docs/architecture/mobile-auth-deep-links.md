# Mobile Auth Deep Links

Overload mobile auth callbacks use a single Expo deep-link route for Supabase email actions such as password reset. Provider OAuth will reuse the same callback route in later issues.

## App scheme

| Setting | Value |
| --- | --- |
| Expo scheme | `overload` |
| Callback path | `auth/callback` |
| Expo Router route | `/auth/callback` |
| Redirect helper | `createAuthRedirectUrl()` in `apps/mobile/src/lib/auth-linking.ts` |

Example production callback URL:

```text
overload://auth/callback
```

Example Expo Go development callback URL:

```text
exp://127.0.0.1:8081/--/auth/callback
```

The exact Expo Go host/port may vary by machine. Use `createAuthRedirectUrl()` at runtime rather than hardcoding a dev URL in app code.

## Supabase redirect allowlist

Add these redirect URLs in the Supabase project **Authentication → URL Configuration → Redirect URLs** allowlist.

### Local development

Configured in `supabase/config.toml` for the Supabase CLI:

- `exp://127.0.0.1:8081`
- `exp://127.0.0.1:8081/--/auth/callback`
- `exp://localhost:8081`
- `exp://localhost:8081/--/auth/callback`
- `overload://auth/callback`

For hosted Supabase projects used during mobile dev, add the same values in the dashboard allowlist.

### Production

Add at minimum:

- `overload://auth/callback`

If QA uses Expo Go against a hosted Supabase project, also allow the Expo Go callback URL used by that device/build.

## Callback handling

1. Supabase sends the user back to `createAuthRedirectUrl()`.
2. Expo Router opens `/auth/callback`.
3. The callback screen parses hash/query params and restores the session with:
   - `supabase.auth.setSession()` for token fragments, or
   - `supabase.auth.exchangeCodeForSession()` for PKCE auth codes.
4. Recovery callbacks (`type=recovery`) route to `/reset-password`.
5. Other successful callbacks route through onboarding resolution.
6. Malformed or expired callbacks show a safe error state and return the user to `/sign-in`.

## Security notes

- Mobile uses only the Supabase publishable anon key.
- No service role keys or provider secrets belong in `apps/mobile`.
- Password reset request copy is intentionally non-enumerating.
- Callback parsing rejects URLs that do not match the auth callback route.

## QA checklist

- Open app from a valid Supabase callback URL.
- Open app from a malformed callback URL.
- Open callback while signed out.
- Complete password reset through callback → `/reset-password`.
- Confirm no service role key or provider secret exists in mobile code.
