// Ensures the verified production Worker has exactly one guarded deploy path.
// Staging deployments and Cloudflare preview publishing are separate operations.
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

const workflowDir = resolve(".github/workflows");
const read = (filename) => readFileSync(resolve(workflowDir, filename), "utf8");
const verify = read("anevum-verify.yml");
const prod = read("deploy-production.yml");
const failures = [];

if (/run:\s*(?:npx\s+)?wrangler\s+deploy\b/.test(verify) ||
    /command:\s*deploy\b/.test(verify)) {
  failures.push("Verification workflow must never deploy a production Worker.");
}
if (!/Verify production member release prerequisites before deployment/.test(prod) ||
    !/node scripts\/verify-member-bindings\.mjs --require-live/.test(prod) ||
    !/name: Deploy to Cloudflare Workers[\s\S]*uses: cloudflare\/wrangler-action@v3[\s\S]*command: deploy/.test(prod)) {
  failures.push("Single production deployment must follow guarded member preflight.");
}
for (const file of readdirSync(workflowDir).filter(name => name.endsWith(".yml"))) {
  if (file === "deploy-production.yml") continue;
  const yaml = read(file);
  // Unqualified wrangler deploy targets the live script. Explicit --config deployments
  // are only permitted when targeting the dedicated staging Worker.
  const unguarded = yaml.split("\n").some((line) =>
    /^\s*run:\s*(?:npx\s+)?wrangler\s+deploy\s*$/.test(line) ||
    /^\s*command:\s*deploy\s*$/.test(line)
  );
  if (unguarded) failures.push(file + " contains an unguarded default Worker deploy.");
}
if (failures.length) {
  for (const issue of failures) process.stderr.write("ERROR: " + issue + "\n");
  process.exit(1);
}
console.log("Production deployment contract: one guarded Worker deploy; verification is read-only.");
