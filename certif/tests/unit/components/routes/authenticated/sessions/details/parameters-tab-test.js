import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Unit | Component | authenticated/sessions/details/parameters-tab', function(hooks) {
  setupTest(hooks);

  test('it exists', function(assert) {
    const component = this.owner.lookup('component:routes/authenticated/sessions/details/parameters-tab');
    assert.ok(component);
  });
});
