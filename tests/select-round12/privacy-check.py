"""Fail-closed compatibility entry point; all release checks live in the Node gate."""
from pathlib import Path
import subprocess
import sys
try:
    result = subprocess.run(['node', str(Path(__file__).with_suffix('.cjs')), *sys.argv[1:]], check=False)
    sys.exit(result.returncode)
except OSError:
    print('{"status":"BLOCKED","reason":"privacy-runtime-unavailable"}')
    sys.exit(1)
