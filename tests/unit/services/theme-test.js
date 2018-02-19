import config from '../../../config/environment';
import { moduleFor, test } from 'ember-qunit';

moduleFor('service:theme', 'Unit | Service | theme', {
  // Specify the other units that are required for this test.
  // needs: ['service:foo']
});

// Replace this with your real tests.
test('it exists', function(assert) {
    let service = this.subject();
    assert.ok(service);
});

test('themes have proper config', function(assert) {
    let defaultProvider = config.PREPRINTS.defaultProvider;
    assert.equal(defaultProvider, 'osf');
});
