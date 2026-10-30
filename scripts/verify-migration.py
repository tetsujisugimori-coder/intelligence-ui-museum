"""Check imported bytes and v09 identity using only Python's standard library."""
from pathlib import Path
import hashlib
import json
import re
import io
import subprocess
import sys
import tarfile
import tempfile

root = Path(__file__).resolve().parents[1]
manifest = json.loads((root / "docs/import-manifest.json").read_text())
assert len(manifest["files"]) == 302, "source file count changed"
paths = set()
exact_import = "--check-import" in sys.argv
# Verify the original 302 files from the preserved local Git bundle. Working
# source can evolve; historical evidence and the original manifest stay fixed.
with tempfile.TemporaryDirectory(prefix="museum-history-") as temp:
    subprocess.run(["git", "clone", "--bare", "--quiet", str(root / "archive/stage2r2/stage2r2-history.bundle"), temp + "/history.git"], check=True)
    data = subprocess.check_output(["git", "--git-dir=" + temp + "/history.git", "archive", manifest["upstream_git"]["head"]])
    with tarfile.open(fileobj=io.BytesIO(data)) as archive:
        members = {m.name: m for m in archive.getmembers() if m.isfile()}
        assert len(members) == 302
        for entry in manifest["files"]:
            name = entry["source_path"].removeprefix("source/")
            assert hashlib.sha256(archive.extractfile(members[name]).read()).hexdigest() == entry["sha256"], name
for entry in manifest["files"]:
    rel = Path(entry["path"])
    assert not rel.is_absolute() and ".." not in rel.parts
    assert entry["path"] not in paths, "duplicate imported path"
    paths.add(entry["path"])
    original_name = entry["source_path"].removeprefix("source/")
    protected = original_name.startswith(("evidence/", "baseline/")) or original_name == ".openai/hosting.json"
    if exact_import or protected:
        assert hashlib.sha256((root / rel).read_bytes()).hexdigest() == entry["sha256"], entry["path"]

expected = "327aec2c8e68479fd8c8dae51e0e5fc958c1db311dd12e9fafd06e3379cd7c97"
original = (root / "legacy/v09/index.html").read_bytes()
assert hashlib.sha256(original).hexdigest() == expected
for rel in ["apps/v10/public/v09-original.html", "apps/v10/dist/v09-original.html"]:
    assert original == (root / rel).read_bytes(), rel

def dataset(data):
    match = re.search(r'<script[^>]*id="dataset"[^>]*>([\s\S]*?)</script>', data.decode())
    assert match, "dataset missing"
    return json.loads(match[1])

items = dataset(original)
assert [x["id"] for x in items] == list(range(1, 118))
assert len({x["name"] for x in items}) == 117
assert len({x["category"] for x in items}) == 11
assert dataset((root / "apps/v10/public/v09-viewer.html").read_bytes()) == items
old = dataset((root / "apps/v10/baseline/v08.html").read_bytes())
identity = lambda rows: [(x["id"], x["name"], x["category"]) for x in rows]
assert identity(items[:105]) == identity(old)
assert not (root / "apps/v10/.openai/hosting.json").exists()
assert not (root / ".openai/hosting.json").exists()
for entry in json.loads((root / "docs/archive-manifest.json").read_text()):
    assert hashlib.sha256((root / entry["path"]).read_bytes()).hexdigest() == entry["sha256"], entry["path"]
print("PASS: 302 original bundle hashes; protected historical files; v09 byte equality; 117 identities / 11 categories; v08 105 identities; viewer dataset")
if exact_import:
    print("PASS: all 302 currently imported files also match original bytes")
print("Scope: static preservation only; no browser, build, current dependency audit or remote CI assertion")
