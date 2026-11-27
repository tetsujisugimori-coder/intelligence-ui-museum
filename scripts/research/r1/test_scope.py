"""Git-backed controls for separating the PR patch from base-only product changes."""
from pathlib import Path
import subprocess
import tempfile
import unittest

from catalog import ROOT
from check_scope import check_scope


class ScopeContract(unittest.TestCase):
    def setUp(self):
        work = ROOT / '.work/research-r1'
        work.mkdir(parents=True, exist_ok=True)
        temp = tempfile.TemporaryDirectory(prefix='scope-fixture-', dir=work)
        self.addCleanup(temp.cleanup)
        self.repo = Path(temp.name)
        self.git('init', '-q')
        self.git('config', 'user.name', 'Scope fixture')
        self.git('config', 'user.email', 'scope@example.invalid')
        self.git('config', 'commit.gpgsign', 'false')
        self.write('apps/v11/index.html', '168\n')
        self.write('legacy/v09/original.html', 'protected\n')
        self.frozen = self.commit()
        self.tree = self.git('rev-parse', 'HEAD^{tree}')
        self.write('apps/v11/index.html', '171\n')
        self.write('apps/v11/wave16.js', 'base only\n')
        self.base = self.commit()
        self.git('checkout', '-q', '--detach', self.frozen)
        self.write('docs/research/r1/catalog.json', 'historical 168\n')
        self.r1 = self.commit()

    def git(self, *args):
        return subprocess.check_output(['git', *args], cwd=self.repo, text=True).strip()

    def write(self, relative, text):
        path = self.repo / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding='utf-8')

    def commit(self):
        self.git('add', '-A')
        self.git('commit', '-qm', 'fixture')
        return self.git('rev-parse', 'HEAD')

    def scope(self, base=None, head=None, tree=None):
        return check_scope(self.repo, base if base is not None else self.base,
                           head if head is not None else self.git('rev-parse', 'HEAD'),
                           self.frozen, tree if tree is not None else self.tree)

    def test_base_only_product_updates_are_not_pr_changes(self):
        report = self.scope()
        self.assertEqual(report['mergeBase'], self.frozen)
        self.assertEqual(report['changedPaths'], ['docs/research/r1/catalog.json'])

    def test_original_base(self):
        self.assertEqual(self.scope(base=self.frozen)['mergeBase'], self.frozen)

    def test_r1_merged_updated_base(self):
        self.git('merge', '--no-edit', self.base)
        report = self.scope()
        self.assertEqual(report['mergeBase'], self.base)
        self.assertEqual(report['changedPaths'], ['docs/research/r1/catalog.json'])

    def test_injected_wave16_path_is_rejected(self):
        self.write('apps/v11/wave16.js', 'not a base-only edit\n')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'protected PR paths changed.*apps/v11/wave16.js'):
            self.scope()

    def test_moving_protected_source_into_allowed_directory_is_rejected(self):
        self.git('mv', 'legacy/v09/original.html', 'docs/research/r1/original.html')
        self.commit()
        with self.assertRaisesRegex(ValueError, 'protected PR paths changed.*legacy/v09/original.html'):
            self.scope()

    def test_newline_path_cannot_spoof_an_allowed_path(self):
        self.write('apps/v11/protected\ndocs/r1.js', 'blocked\n')
        self.commit()
        with self.assertRaisesRegex(ValueError, r'protected.*apps/v11/protected\\ndocs/r1.js'):
            self.scope()

    def test_wrong_head_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'checkout must match PR head SHA'):
            self.scope(head=self.base)

    def test_ref_alias_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'full commit SHAs'):
            self.scope(base='HEAD')

    def test_baseline_tree_mismatch_is_rejected(self):
        with self.assertRaisesRegex(ValueError, 'baseline tree mismatch'):
            self.scope(tree='a'*40)

    def test_unrelated_pr_history_is_rejected(self):
        self.git('checkout', '-q', '--orphan', 'foreign')
        base = self.commit()
        self.git('checkout', '-q', '--detach', self.r1)
        with self.assertRaisesRegex(ValueError, 'PR merge base not found'):
            self.scope(base=base)


if __name__ == '__main__':
    unittest.main()
