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
        self.assertEqual([r['id'] for r in self.good],list(range(1,172)))

    def test_duplicate_id(self):
        self.check_fault(lambda x:x.append(x[0]),'duplicate exhibit ID')

    def test_phantom_id(self):
        self.check_fault(lambda x:x[-1].update(id=172),'missing, invented or reordered ID')

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

    def test_forged_source_line_and_checksum(self):
        self.check_fault(lambda x:x[-1]['source']['template'].update(line=1,blobSha256='a'*64),'bad source reference')

    def test_required_shared_unknown(self):
        self.check_fault(lambda x:x[0]['unknowns'].remove('liveAccessibility'),'mandatory shared UNKNOWN')

    def test_unknown_wrong_type(self):
        self.check_fault(lambda x:x[0].update(unknowns={'error': True}),'mandatory shared UNKNOWN')

    def test_classification_wrong_type(self):
        self.check_fault(lambda x:x[0]['classification'].update(basic={"button":True}),'bad classification reference')

    def test_source_wrong_type(self):
        self.check_fault(lambda x:x[0].update(source=None),'source type')

    def test_binding_scope_demoted(self):
        self.check_fault(lambda x:x[131].update(binding={'status':'N/A','value':None}),'invalid binding evidence/status')

    def test_binding_unknown_not_promoted_to_na(self):
        self.check_fault(lambda x:x[135].update(binding={'status':'N/A','value':None}),'invalid binding evidence/status')

    def test_omitted_linked_view_binding(self):
        self.check_fault(lambda x:x[138]['relations'].remove(['shares-key','composite:chart','composite:table']),'missing shared key relation')

    def test_false_wave12_history(self):
        fixture=deepcopy(self.good)
        fixture[156]['implementation']['state']['value']='条件と履歴'
        validate(fixture,self.registry,self.taxonomy)
        with self.assertRaisesRegex(ValueError,'false decision history 157'):
            pinned_vectors(fixture)

    def test_wave16_detail_source_forgery(self):
        self.check_fault(lambda x:x[170]['source']['dynamic']['composite:list'].update(line=1), 'bad dynamic source reference')

    def test_wave16_hidden_association(self):
        fixture=deepcopy(self.good)
        fixture[169]['relations'].remove(['contains','composite:timeline','basic:text'])
        validate(fixture,self.registry,self.taxonomy)
        with self.assertRaisesRegex(ValueError,'missing Wave 16 history containment 170'):
            pinned_vectors(fixture)

    def test_wave16_classification_omission(self):
        fixture=deepcopy(self.good)
        fixture[170]['classification']['pattern'].remove('search')
        validate(fixture,self.registry,self.taxonomy)
        with self.assertRaisesRegex(ValueError,'independent positive vector 171'):
            pinned_vectors(fixture)

    def test_wave16_false_inference(self):
        fixture=deepcopy(self.good)
        fixture[170]['classification']['visualize'].append('network')
        fixture[170]['classification']['visualize'].sort()
        validate(fixture,self.registry,self.taxonomy)
        with self.assertRaisesRegex(ValueError,'false independent vector 171'):
            pinned_vectors(fixture)

    def test_initial_text_type(self):
        self.check_fault(lambda x:x[0]['implementation'].update(initialText=None),'initial text type')

    def test_missing_template_markers(self):
        self.check_fault(lambda x:x[0]['accessibility'].pop('templateMarkers'),'accessibility marker schema')

    def test_same_story_wrong_semantic_tag(self):
        fixture=deepcopy(self.good)
        fixture[120]['classification']['visualize'].remove('statistics')
        validate(fixture,self.registry,self.taxonomy)
        with self.assertRaisesRegex(ValueError,'independent positive vector 121'):
            pinned_vectors(fixture)


if __name__ == '__main__':
    unittest.main()
