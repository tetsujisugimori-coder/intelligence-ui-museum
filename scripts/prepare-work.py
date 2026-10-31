"""Create a disposable copy so historical build/test evidence is never overwritten."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
source = root / "apps/v10"
target = root / ".work/v10"
if target.exists():
    raise SystemExit(".work/v10 already exists; choose a fresh checkout or move that work aside first")
shutil.copytree(source, target, ignore=shutil.ignore_patterns("node_modules"))
print("Prepared .work/v10; imported source/evidence unchanged")
