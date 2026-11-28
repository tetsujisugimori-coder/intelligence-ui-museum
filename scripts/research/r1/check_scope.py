"""Check this pull request's committed paths, not the historical inventory source."""
import argparse
import json
from pathlib import Path
import re
import subprocess

from catalog import BASE, ROOT, TREE


def check_scope(repo, base, head, baseline=BASE, baseline_tree=TREE):
    def git(*args):
        return subprocess.check_output(['git', *args], cwd=repo).rstrip(b'\n')

    def require(condition, message):
        if not condition:
            raise ValueError(message)

    def commit(value):
        require(re.fullmatch(r'[0-9a-f]{40}', value), 'scope refs must be full commit SHAs')
        require(git('cat-file', '-t', value) == b'commit', 'scope ref is not a commit')
        return value

    base, head = commit(base), commit(head)
    require(git('rev-parse', 'HEAD').decode('ascii') == head, 'checkout must match PR head SHA')
    require(git('rev-parse', f'{baseline}^{{tree}}').decode('ascii') == baseline_tree,
            'scope baseline tree mismatch')
    comparison = subprocess.run(['git', 'merge-base', '--all', base, head],
                                cwd=repo, capture_output=True, check=False)
    require(comparison.returncode == 0, 'PR merge base not found; verify complete history')
    points = comparison.stdout.splitlines()
    require(len(points) == 1, 'scope requires exactly one PR merge base')
    point = points[0].decode('ascii')
    require(subprocess.run(['git', 'merge-base', '--is-ancestor', baseline, point],
                           cwd=repo, check=False).returncode == 0,
            'PR merge base must descend from the frozen inventory baseline')
    # Compare merge-base -> head, the PR's changes; base-only additions must not be
    # charged to this PR. With renames disabled both sides of a move are checked.
    raw = git('diff', '--name-only', '-z', '--no-renames', '--no-ext-diff',
              '--no-relative', '--ignore-submodules=none', point, head, '--')
    paths = raw.decode('utf-8', errors='surrogateescape').split('\0')[:-1]
    protected = [p for p in paths if not (p.startswith(('docs/research/r1/', 'scripts/research/r1/'))
                                          or p == '.github/workflows/research-r1.yml')]
    require(not protected, 'protected PR paths changed: ' + json.dumps(protected))
    return {'prBase': base, 'prHead': head, 'mergeBase': point, 'changedPaths': paths}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--base', required=True, help='event pull_request.base.sha')
    ap.add_argument('--head', required=True, help='event pull_request.head.sha; must be checked out')
    args = ap.parse_args()
    try:
        print(json.dumps(check_scope(Path(ROOT), args.base, args.head), ensure_ascii=True))
    except (ValueError, subprocess.CalledProcessError) as exc:
        ap.exit(1, f'{exc}\n')


if __name__ == '__main__':
    main()
