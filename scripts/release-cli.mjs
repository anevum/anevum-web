import { currentRelease, loadReleaseRegistry, releaseBySlug, releaseByVersion } from "./release-registry.mjs";

const [command, value] = process.argv.slice(2);
const registry = loadReleaseRegistry();

let release;
if (command === "current") release = currentRelease(registry);
else if (command === "slug") release = releaseBySlug(value, registry);
else if (command === "version") release = releaseByVersion(value, registry);
else throw new Error("Usage: node scripts/release-cli.mjs current|slug <slug>|version <version>");

const field = process.env.RELEASE_FIELD;
if (field) {
  const result = release[field];
  if (result == null) throw new Error("Release field does not exist: " + field);
  process.stdout.write(String(result));
} else {
  process.stdout.write(JSON.stringify(release));
}
