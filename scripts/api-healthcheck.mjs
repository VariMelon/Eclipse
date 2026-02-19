const baseUrl = process.env.HEALTHCHECK_BASE_URL || "http://localhost:3000";

const checks = [
  { path: "/api/signup", expectedStatus: 200 },
  { path: "/api/signin", expectedStatus: 200 },
];

async function run() {
  let failed = false;

  for (const check of checks) {
    const url = `${baseUrl}${check.path}`;

    try {
      const response = await fetch(url, { method: "GET" });
      const ok = response.status === check.expectedStatus;

      if (!ok) {
        failed = true;
        console.error(`FAIL ${check.path}: expected ${check.expectedStatus}, got ${response.status}`);
      } else {
        console.log(`PASS ${check.path}: ${response.status}`);
      }
    } catch (error) {
      failed = true;
      console.error(`FAIL ${check.path}: request error`, error);
    }
  }

  if (failed) {
    console.error("API health check failed.");
    process.exit(1);
  }

  console.log("API health check passed.");
}

run();
