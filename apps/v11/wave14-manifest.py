"""Bind the CI aggregate and exact original evidence files to the checkout."""
from hashlib import sha256
from pathlib import Path
import json
import os
import sys


def require(predicate, message):
    if not predicate:
        raise ValueError(message)


def manifest(root):
    root.mkdir(parents=True, exist_ok=True)
    names = ("FIXED", "INSTALL", "CONTRACTS", "BROWSER", "AUDIT")
    outcomes = {name.lower(): os.environ.get(name) or "not_recorded" for name in names}
    success = all(outcome == "success" for outcome in outcomes.values())
    aggregate = {"schema": 1, "status": "PASS" if success else "NOT_PASS",
                 "steps": outcomes, "prHead": os.environ.get("EXPECTED_HEAD"),
                 "run": os.environ.get("GITHUB_RUN_ID"), "attempt": os.environ.get("GITHUB_RUN_ATTEMPT")}
    for key, name in (("commit", "commit.txt"), ("tree", "tree.txt")):
        path = root / name
        aggregate[key] = path.read_text().strip() if path.is_file() and not path.is_symlink() else None
    require(not (root / "aggregate.json").exists() and not (root / "manifest.json").exists(),
            "refusing to overwrite an earlier receipt")
    rows = {}
    for path in sorted(root.rglob("*")):
        require(not path.is_symlink(), f"symlink in evidence: {path.name}")
        if not path.is_file():
            continue
        data = path.read_bytes()
        rows[path.relative_to(root).as_posix()] = {"size": len(data), "sha256": sha256(data).hexdigest()}
    aggregate_bytes = (json.dumps(aggregate, indent=2) + "\n").encode()
    with (root / "aggregate.json").open("xb") as dst:
        dst.write(aggregate_bytes)
    rows["aggregate.json"] = {"size": len(aggregate_bytes), "sha256": sha256(aggregate_bytes).hexdigest()}
    with (root / "manifest.json").open("x") as dst:
        json.dump({"schema": 1, "scope": "all original files except manifest",
                   "commit": aggregate["commit"], "tree": aggregate["tree"], "files": rows}, dst, indent=2)
    return 0 if success else 1


if __name__ == "__main__":
    [path] = sys.argv[1:]
    raise SystemExit(manifest(Path(path)))
