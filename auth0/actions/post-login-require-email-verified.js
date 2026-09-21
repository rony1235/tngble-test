/**
 * Auth0 Post-Login Action — native signup OTP identity consolidation.
 *
 * Signup creates an `auth0|...` password user, then classic Passwordless Email
 * creates an `email|...` identity while verifying the code. This Action marks
 * the DB user verified, changes the transaction primary to that DB user, and
 * links the Passwordless identity into it. Auth0 then keeps one user row.
 *
 * Secrets:
 *   AUTH0_DOMAIN       dev-xxxx.us.auth0.com (without https://)
 *   M2M_CLIENT_ID      Machine-to-Machine application Client ID
 *   M2M_CLIENT_SECRET  Machine-to-Machine application Client Secret
 *
 * Management API scopes: read:users, update:users
 */

const DB_CONNECTION = 'Username-Password-Authentication';

exports.onExecutePostLogin = async (event, api) => {
  const connection = event.connection?.name || '';
  const strategy = event.connection?.strategy || '';
  const isPasswordlessEmail = connection === 'email' || strategy === 'email';
  const isDatabase = connection === DB_CONNECTION || strategy === 'auth0';

  if (isPasswordlessEmail) {
    try {
      await consolidatePasswordlessLogin(event, api);
    } catch (error) {
      console.log('OTP identity consolidation failed', error?.message || error);
      api.access.deny('account_linking_required');
    }
    return;
  }

  if (isDatabase) {
    try {
      await repairLegacyTwinsOnDatabaseLogin(event);
    } catch (error) {
      // Never block an existing password login because optional cleanup failed.
      console.log('Legacy OTP identity cleanup failed', error?.message || error);
    }
  }
};

async function consolidatePasswordlessLogin(event, api) {
  const email = event.user?.email;
  const currentId = event.user?.user_id;
  if (!email || !currentId) throw new Error('OTP login is missing email or user ID');

  const token = await getManagementToken(event);
  const domain = event.secrets.AUTH0_DOMAIN;
  const users = await getUsersByEmail(domain, token, email);
  const dbUser = users.find(isDatabaseUser);
  if (!dbUser?.user_id) throw new Error('No matching database user');

  if (!dbUser.email_verified) {
    await setEmailVerified(domain, token, dbUser.user_id);
  }

  // A linked email identity can already resolve to the DB primary.
  if (currentId === dbUser.user_id) return;

  const passwordlessUser =
    users.find((user) => user.user_id === currentId && isPasswordlessEmailUser(user)) ||
    (isPasswordlessEmailUser(event.user) ? event.user : null);
  if (!passwordlessUser?.user_id) {
    throw new Error('No Passwordless Email identity to link');
  }

  // Auth0 requires the transaction primary to change before the current
  // secondary identity is linked and removed as a standalone user.
  api.authentication.setPrimaryUser(dbUser.user_id);
  await linkIdentity(domain, token, dbUser.user_id, passwordlessUser);
}

async function repairLegacyTwinsOnDatabaseLogin(event) {
  const email = event.user?.email;
  const currentId = event.user?.user_id;
  if (!email || !currentId) return;

  const token = await getManagementToken(event);
  const domain = event.secrets.AUTH0_DOMAIN;
  const users = await getUsersByEmail(domain, token, email);
  const twins = users.filter(
    (user) =>
      user.user_id && user.user_id !== currentId && isPasswordlessEmailUser(user),
  );
  if (twins.length === 0) return;

  if (!event.user.email_verified && twins.some((user) => user.email_verified)) {
    await setEmailVerified(domain, token, currentId);
  }

  for (const twin of twins) {
    await linkIdentity(domain, token, currentId, twin);
  }
}

async function getManagementToken(event) {
  const domain = event.secrets?.AUTH0_DOMAIN;
  const clientId = event.secrets?.M2M_CLIENT_ID;
  const clientSecret = event.secrets?.M2M_CLIENT_SECRET;
  if (!domain || !clientId || !clientSecret) {
    throw new Error('Missing AUTH0_DOMAIN / M2M_CLIENT_ID / M2M_CLIENT_SECRET');
  }

  const response = await fetch(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: `https://${domain}/api/v2/`,
    }),
  });
  if (!response.ok) {
    throw new Error(`M2M token failed (${response.status}): ${await response.text()}`);
  }
  const body = await response.json();
  if (!body.access_token) throw new Error('M2M token response has no access token');
  return body.access_token;
}

async function getUsersByEmail(domain, token, email) {
  const response = await fetch(
    `https://${domain}/api/v2/users-by-email?email=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!response.ok) {
    throw new Error(`users-by-email failed (${response.status}): ${await response.text()}`);
  }
  const users = await response.json();
  return Array.isArray(users) ? users : [];
}

async function setEmailVerified(domain, token, userId) {
  const response = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_verified: true }),
    },
  );
  if (!response.ok) {
    throw new Error(`Set email_verified failed (${response.status}): ${await response.text()}`);
  }
}

async function linkIdentity(domain, token, primaryUserId, secondaryUser) {
  const identity = (secondaryUser.identities || []).find(
    (item) => item.provider === 'email' || item.connection === 'email',
  );
  const secondaryId =
    identity?.user_id || secondaryUser.user_id.split('|').slice(1).join('|');
  if (!secondaryId) throw new Error('Passwordless identity has no provider user ID');

  const response = await fetch(
    `https://${domain}/api/v2/users/${encodeURIComponent(primaryUserId)}/identities`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ provider: 'email', user_id: secondaryId }),
    },
  );
  if (!response.ok) {
    throw new Error(`Identity link failed (${response.status}): ${await response.text()}`);
  }
}

function isDatabaseUser(user) {
  if (user.user_id?.startsWith('auth0|')) return true;
  return (user.identities || []).some(
    (identity) =>
      identity.provider === 'auth0' || identity.connection === DB_CONNECTION,
  );
}

function isPasswordlessEmailUser(user) {
  if (user.user_id?.startsWith('email|')) return true;
  return (user.identities || []).some(
    (identity) => identity.provider === 'email' || identity.connection === 'email',
  );
}
