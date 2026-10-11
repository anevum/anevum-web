import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { productRegistry, publishedSourceRecords } from "../src/data/products.ts";

const pages = readFileSync(new URL("../src/commons/CommonsPages.tsx", import.meta.url), "utf8");
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("public source registry contains only the two manually verified ANEVUM repositories", () => {
  assert.deepEqual(Object.keys(publishedSourceRecords).sort(), ["rhen","website"]);
  assert.deepEqual(publishedSourceRecords.website,{
    repository:"anevum/anevum-web",
    url:"https://github.com/anevum/anevum-web",
    visibility:"PUBLIC",
    reuse:"APACHE_2_0"
  });
  assert.deepEqual(publishedSourceRecords.rhen,{
    repository:"anevum/rhen",
    url:"https://github.com/anevum/rhen",
    visibility:"PUBLIC",
    reuse:"NO_REPOSITORY_LICENSE"
  });
  assert.ok(Object.isFrozen(publishedSourceRecords));
  assert.ok(Object.isFrozen(publishedSourceRecords.rhen));
  assert.ok(Object.isFrozen(publishedSourceRecords.website));
  assert.deepEqual(productRegistry.map(x => x.slug),["rhen"]);
  assert.strictEqual(productRegistry[0].source,publishedSourceRecords.rhen);
});

test("public Commons links use curated URLs and disclose incompatible licensing", () => {
  assert.match(pages,/Inspect public source/);
  assert.match(pages,/publishedSourceRecords\.rhen\.url/);
  assert.match(pages,/publishedSourceRecords\.website\.url/);
  assert.match(pages,/Apache 2\.0 license/);
  assert.match(pages,/does not currently publish a repository-wide reuse license/);
  assert.match(pages,/Visibility alone does not grant permission/);
  assert.match(pages,/Do not post credentials/);
  assert.match(pages,/target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(pages,/\/api\/command\/integrations|GITHUB_TOKEN|CF_INFRA_READ_TOKEN|RAILWAY_INFRA_PROJECT_TOKEN/);
  assert.doesNotMatch(pages,/fetch\(.*github|GitHub API/i);
  assert.match(pkg.scripts["test:foundation"],/tests\/v5-public-source-links\.test\.mjs/);
});
