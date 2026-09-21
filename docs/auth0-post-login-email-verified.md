# Auth0 Post-Login — Email OTP identity linking

Source: [`auth0/actions/post-login-require-email-verified.js`](../auth0/actions/post-login-require-email-verified.js).

## Why the Action is required

The app keeps signup inside its native UI. Auth0's database-connection Email OTP is only available in Universal Login for this tenant, so the native flow uses two connections:

| User ID | Connection | Purpose |
| --- | --- | --- |
| `auth0\|…` | Username-Password-Authentication | Password identity and final primary account |
| `email\|…` | Passwordless Email | OTP proof of email ownership |

The Action marks the database user verified and links the Passwordless identity into it. The final Auth0 Users page contains one `auth0|…` row with both identities.

## Deploy

1. Create a **Machine to Machine** application.
2. Authorize it for the **Auth0 Management API** with `read:users` and `update:users`.
3. Under **Actions → Library**, create a **Login / Post Login** custom Action.
4. Paste the Action source into the editor.
5. Add these secrets:
   - `AUTH0_DOMAIN` — tenant domain without `https://`
   - `M2M_CLIENT_ID`
   - `M2M_CLIENT_SECRET`
6. Deploy the Action.
7. Under **Actions → Flows → Login**, place it between Start and Complete and select **Apply**.
8. Enable **Password** and **Passwordless OTP** grants on the Native application.
9. Enable **Authentication → Passwordless → Email** for the Native application.

## Existing duplicate users

After deployment, a database password login attempts to repair an existing matching `email|…` twin. Completing signup OTP also performs the link immediately.

For manual cleanup, keep the `auth0|…` user, mark it verified, and delete only the matching standalone `email|…` user.

## Smoke test

1. Use a fresh disposable email or remove prior test rows for that address.
2. Enter name, email, and password in the app and request the code.
3. Enter the email OTP.
4. Confirm the app continues to Home.
5. Confirm Auth0 has one verified `auth0|…` row with both `auth0` and `email` identities.
