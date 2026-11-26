"""Fault injection around the fixed-source inventory. Stdlib unittest, no production updates."""
from copy import deepcopy
import unittest

from catalog import make, pinned_vectors, validate


class CatalogContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.good, cls.registry, cls.taxonomy = make()

    def check_fault(self, func, cause):
        fixture = deepcopy(self.good)
        func(fixture)
        with self.assertRaisesRegex(ValueError, cause):
            validate(fixture,self.registry,self.taxonomy)

    def test_complete_fixed_entry_set_and_literal_vectors(self):
        validate(self.good,self.registry,self.taxonomy)
        pinned_vectors(self.good)
        self.assertEqual([r['id'] for r in self.good],list(range(1,169)))

    def test_duplicate_id(self):
        self.check_fault(lambda x:x.append(x[0]),'duplicate exhibit ID')

    def test_phantom_id(self):
        self.check_fault(lambda x:x[-1].update(id=171),'missing, invented or reordered ID')

    def test_missing_exhibit(self):
        self.check_fault(lambda x:x.pop(),'missing, invented or reordered ID')

    def test_renamed_exhibit(self):
        self.check_fault(lambda x:x[0].update(name='Other'),'legacy identity drift')

    def test_reclassified_legacy(self):
        self.check_fault(lambda x:x[0].update(legacyCategory='Other'),'legacy identity drift')

    def test_mandatory_field(self):
        self.check_fault(lambda x:x[0].pop('purpose'),'mandatory exhibit fields')

    def test_invalid_class(self):
        self.check_fault(lambda x:x[0]['classification']['visualize'].append('bogus'),'bad classification reference')

    def test_invalid_component(self):
        self.check_fault(lambda x:x[0]['classification']['basic'].insert(0,'bogus'),'bad classification reference')

    def test_invalid_relation(self):
        self.check_fault(lambda x:x[0]['relations'].append(['contains','composite:ghost','basic:button']),'unregistered relation source')

    def test_duplicate_relation(self):
        self.check_fault(lambda x:x[0]['relations'].append(x[0]['relations'][0]),'invalid or duplicate relation')

    def test_wrong_source(self):
        self.check_fault(lambda x:x[-1]['source']['template'].update(path='apps/v11/wave3.js'),'bad source reference')

    def test_unknown_masked(self):
        self.check_fault(lambda x:x[0]['implementation']['error'].update(value='a claimed error'),'UNKNOWN masked')

    def test_ai_hypothesis_promoted(self):
        self.check_fault(lambda x:x[-1]['aiHypotheses'].update(status='SOURCE_READ'),'invalid AI hypothesis')

    def test_accessibility_promoted(self):
        self.check_fault(lambda x:x[-1]['accessibility'].update(runtime='PASS'),'accessibility promotion')

    def test_same_story_wrong_semantic_tag(self):
        fixture=deepcopy(self.good)
        fixture[120]['classification']['visualize'].remove('statistics')
        validate(fixture,self.registry,self.taxonomy)
        with self.assertRaisesRegex(ValueError,'independent positive vector 121'):
            pinned_vectors(fixture)


if __name__ == '__main__':
    unittest.main()
