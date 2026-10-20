#!/usr/bin/env python3
"""Construct a byte-preserving CSS-only hotfix from two immutable CI artifacts."""
import argparse
import hashlib
import json
import shutil
from pathlib import Path

OLD = "index-DU9BE5mP.css"
JS = "index-AsGe25lN.js"
GOOD = "index-D0zm7CJm.css"
MARK = b".av79-navigation .ir80-wayfinder-entry{"
STOP = b".ir87-companion{"
SHA_JS = "09063ce69dbe6aaa992c2e25429f03ae6cd08165e0b4cffb53be29ab423e772f"
SHA_CSS = "a0da446ea4f17b97cc296eef55aeff5d1ceaad2ae25ab78bc16f1e87b8a7a20c"

def sha(content):
    return hashlib.sha256(content).hexdigest()

def check(condition, error):
    if not condition:
        raise RuntimeError(error)

def main():
    parser = argparse.ArgumentParser()
    for arg in ("baseline", "fixed", "output", "evidence"):
        parser.add_argument("--" + arg, type=Path, required=True)
    args = parser.parse_args()
    live = args.baseline / "react-web"
    fixed = args.fixed / "react-web"
    old_css = (live / "assets" / OLD).read_bytes()
    good_css = (fixed / "assets" / GOOD).read_bytes()
    js = (live / "assets" / JS).read_bytes()
    old_html = (live / "index.html").read_bytes()
    check(sha(old_css) == SHA_CSS and sha(js) == SHA_JS, "Production asset pin mismatch")
    check(old_html.count(("/assets/" + OLD).encode()) == 1, "Expected original CSS tag exactly once")
    check(old_html.count(("/assets/" + JS).encode()) == 1, "Expected original JS tag exactly once")
    a, c = old_css.index(MARK), good_css.index(MARK)
    b, d = old_css.index(STOP, a), good_css.index(STOP, c)
    replacement = good_css[c:d]
    check(b"grid-column:1/-1" in replacement, "Fixed CSS missing full-width helper")
    check(b"@media (max-width:650px)" in replacement, "Fixed CSS missing mobile helper")
    check(b".ir80-wayfinder-action{display:none}" not in replacement, "Helper hidden on small phones")
    updated = old_css[:a] + replacement + old_css[b:]
    check(updated[:a] == old_css[:a] and updated[a + len(replacement):] == old_css[b:], "Other CSS changed")
    new_name = "index-iren-wayfinder-" + sha(updated)[:16] + ".css"
    new_html = old_html.replace(("/assets/" + OLD).encode(), ("/assets/" + new_name).encode())
    check(("/assets/" + JS).encode() in new_html, "JS entrypoint changed")
    if args.output.exists():
        shutil.rmtree(args.output)
    shutil.copytree(live, args.output)
    (args.output / "assets" / new_name).write_bytes(updated)
    (args.output / "index.html").write_bytes(new_html)
    orig = {str(p.relative_to(live)): sha(p.read_bytes()) for p in live.rglob("*") if p.is_file()}
    dest = {str(p.relative_to(args.output)): sha(p.read_bytes()) for p in args.output.rglob("*") if p.is_file()}
    check(set(dest) == set(orig) | {"assets/" + new_name}, "Unexpected added/missing asset")
    check(all(dest[k] == digest for k, digest in orig.items() if k != "index.html"), "Existing asset modified")
    check(dest["assets/" + JS] == SHA_JS and dest["assets/" + OLD] == SHA_CSS, "Protected assets changed")
    check(dest["assets/" + new_name] == sha(updated), "New CSS digest mismatch")
    report = {
        "session": "ANEVUM.WEB.PATCH.2026-10-19.004.IREN-WAYFINDER-LIVE-CSS",
        "baseline_run": 39339804557, "fixed_run": 39345116874,
        "baseline_css": OLD, "new_css": new_name, "js": JS,
        "css_replaced_byte_range": [a, b], "original_css_sha256": SHA_CSS,
        "new_css_sha256": sha(updated), "js_sha256": SHA_JS,
        "before_file_count": len(orig), "after_file_count": len(dest),
        "modified_files": ["index.html"], "added_files": ["assets/" + new_name],
        "all_other_files_byte_identical": True
    }
    args.evidence.mkdir(parents=True, exist_ok=True)
    (args.evidence / "binary-parity.json").write_text(json.dumps(report, indent=2) + "\n")
    print("IREN_LIVE_SOURCE_BINARY_HOTFIX=PASS")
    print(json.dumps(report))

if __name__ == "__main__":
    main()
