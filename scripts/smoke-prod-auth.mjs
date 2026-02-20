const base = process.env.SMOKE_BASE_URL || 'https://eclipse-five-wheat.vercel.app';
const suffix = Date.now();
const password = 'Eclipse!23456';

const user1 = {
  email: `smoke${suffix}.a@eclipse.local`,
  name: `smokea${suffix}`,
  password,
};

const user2 = {
  email: `smoke${suffix}.b@eclipse.local`,
  name: `smokeb${suffix}`,
  password,
};

function parseSetCookie(headers) {
  const setCookie = headers.getSetCookie?.() ?? [];
  const jar = {};

  for (const cookie of setCookie) {
    const [pair] = cookie.split(';');
    const [name, ...valueParts] = pair.split('=');
    jar[name] = valueParts.join('=');
  }

  return jar;
}

function mergeCookieJar(target, incoming) {
  Object.assign(target, incoming);
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function requestJson(path, options = {}, jar) {
  const headers = {
    ...(options.headers || {}),
  };

  if (jar && Object.keys(jar).length > 0) {
    headers.cookie = cookieHeader(jar);
  }

  const res = await fetch(`${base}${path}`, {
    redirect: 'manual',
    ...options,
    headers,
  });

  if (jar) {
    mergeCookieJar(jar, parseSetCookie(res.headers));
  }

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: res.status, body, headers: res.headers };
}

function assertStatus(actual, expected, label, body) {
  if (actual !== expected) {
    throw new Error(`${label} expected ${expected} got ${actual}: ${JSON.stringify(body)}`);
  }
}

async function signInWithNextAuth(user, jar) {
  const csrf = await requestJson('/api/auth/csrf', { method: 'GET' }, jar);
  assertStatus(csrf.status, 200, 'csrf', csrf.body);

  const form = new URLSearchParams({
    csrfToken: csrf.body.csrfToken,
    username: user.name,
    password: user.password,
    callbackUrl: `${base}/dashboard`,
    json: 'true',
  });

  const callback = await requestJson(
    '/api/auth/callback/credentials?json=true',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    },
    jar,
  );

  if (callback.status !== 200 && callback.status !== 302) {
    throw new Error(`credentials callback failed: ${callback.status} ${JSON.stringify(callback.body)}`);
  }

  const session = await requestJson('/api/auth/session', { method: 'GET' }, jar);
  assertStatus(session.status, 200, 'session', session.body);

  if (!session.body?.user?.name) {
    throw new Error(`session missing user: ${JSON.stringify(session.body)}`);
  }

  return session.body.user;
}

async function main() {
  console.log(`Base URL: ${base}`);

  const signup1 = await requestJson('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user1),
  });
  assertStatus(signup1.status, 201, 'signup user1', signup1.body);

  const signup2 = await requestJson('/api/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user2),
  });
  assertStatus(signup2.status, 201, 'signup user2', signup2.body);

  console.log(`Signup OK: ${signup1.body.id}, ${signup2.body.id}`);

  const jar1 = {};
  const jar2 = {};

  const sessionUser1 = await signInWithNextAuth(user1, jar1);
  const sessionUser2 = await signInWithNextAuth(user2, jar2);

  console.log(`Session OK: ${sessionUser1.name}, ${sessionUser2.name}`);

  const campaign = await requestJson(
    '/api/campaigns',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Smoke Campaign ${suffix}` }),
    },
    jar1,
  );
  assertStatus(campaign.status, 201, 'create campaign', campaign.body);

  const campaignId = campaign.body.id;
  console.log(`Campaign OK: ${campaignId}`);

  const invite = await requestJson(
    '/api/campaigns/members',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, userId: signup2.body.id, role: 'PLAYER' }),
    },
    jar1,
  );
  assertStatus(invite.status, 201, 'invite member', invite.body);
  console.log(`Invite OK: ${invite.body.id}`);

  const approve = await requestJson(
    '/api/campaigns/members',
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', campaignId, userId: signup2.body.id }),
    },
    jar2,
  );
  assertStatus(approve.status, 200, 'approve invite', approve.body);
  console.log(`Approve OK: ${approve.body.userId} ${approve.body.role}`);

  const members = await requestJson(`/api/campaigns/members?campaignId=${campaignId}`, { method: 'GET' }, jar1);
  assertStatus(members.status, 200, 'list members', members.body);
  console.log(`Verify OK: members=${members.body.members.length} pending=${members.body.pendingInvites.length}`);

  console.log('Production authenticated smoke test PASSED');
}

main().catch((error) => {
  console.error('Production authenticated smoke test FAILED');
  console.error(error.message);
  process.exit(1);
});
