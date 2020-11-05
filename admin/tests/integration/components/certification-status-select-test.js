import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import EmberObject from '@ember/object';
import { clickTrigger, selectChoose } from 'ember-power-select/test-support/helpers';

module('Integration | Component | certification-status-select', function(hooks) {

  setupRenderingTest(hooks);

  module('rendering', function() {

    test('it has a label', async function(assert) {
      // given
      this.set('certification', { status: 'validated' });

      // when
      await render(hbs`<CertificationStatusSelect @certification={{certification}} />`);

      // then
      assert.dom('.certification-status-select label').hasText('Statut :');
    });

    test('it has values', async function(assert) {
      // given
      this.set('certification', { status: 'validated' });
      await render(hbs`<CertificationStatusSelect @certification={{certification}} />`);

      // when
      await clickTrigger();

      // then
      assert.dom('.ember-power-select-option').exists({ count: 4 });
    });
  });

  module('behaviour', function() {

    test('it updates the certification status when the selected value changes', async function(assert) {
      // given
      const certification = EmberObject.create({ status: 'started' });
      this.set('certification', certification);
      await render(hbs`<CertificationStatusSelect @certification={{certification}} />`);

      // when
      await selectChoose('.certification-status-select', 'Validée');

      // then
      assert.equal(this.certification.status, 'validated');
    });
  });
});
