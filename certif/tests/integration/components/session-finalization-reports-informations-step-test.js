import { module, test } from 'qunit';
import sinon from 'sinon';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import { run } from '@ember/runloop';

module('Integration | Component | session-finalization-reports-informations-step', function(hooks) {
  setupRenderingTest(hooks);
  let reportA;
  let reportB;
  let store;

  hooks.beforeEach(async function() {
    store = this.owner.lookup('service:store');
    reportA = run(() => store.createRecord('certification-report', {
      certificationCourseId: 1234,
      firstName: 'Alice',
      lastName: 'Alister',
      examinerComment: 'coucou',
      hasSeenEndTestScreen: null,
    }));
    reportB = run(() => store.createRecord('certification-report', {
      certificationCourseId: 3,
      firstName: 'Bob',
      lastName: 'Bober',
      examinerComment: null,
      hasSeenEndTestScreen: true,
    }));
    this.set('certificationReports', [reportA, reportB]);
    this.set('updateCertificationReportExaminerComment', sinon.stub().returns('new comment'));
    this.set('examinerCommentMaxLength', 500);
    this.set('toggleCertificationReportHasSeenEndTestScreen', sinon.stub().returns());
    this.set('toggleAllCertificationReportsHasSeenEndTestScreen', sinon.stub().returns());
  });

  module('when feature categorizationOfReports is off', function() {

    test('it renders', async function(assert) {
      // given
      this.set('isReportsCategorizationFeatureToggleEnabled', false);

      // when
      await render(hbs`
        <SessionFinalizationReportsInformationsStep
          @certificationReports={{this.certificationReports}}
          @updateCertificationReportExaminerComment={{this.updateCertificationReportExaminerComment}}
          @examinerCommentMaxLength={{this.examinerCommentMaxLength}}
          @toggleCertificationReportHasSeenEndTestScreen={{this.toggleCertificationReportHasSeenEndTestScreen}}
          @toggleAllCertificationReportsHasSeenEndTestScreen={{this.toggleAllCertificationReportsHasSeenEndTestScreen}}
        />
      `);

      // then
      assert.dom(`[data-test-id="finalization-report-last-name_${reportA.certificationCourseId}"]`).hasText(reportA.lastName);
      assert.dom(`[data-test-id="finalization-report-first-name_${reportA.certificationCourseId}"]`).hasText(reportA.firstName);
      assert.dom(`[data-test-id="finalization-report-certification-number_${reportA.certificationCourseId}"]`).hasText(reportA.certificationCourseId.toString());
      assert.dom(`[data-test-id="finalization-report-last-name_${reportB.certificationCourseId}"]`).hasText(reportB.lastName);
      assert.dom(`[data-test-id="finalization-report-first-name_${reportB.certificationCourseId}"]`).hasText(reportB.firstName);
      assert.dom(`[data-test-id="finalization-report-certification-number_${reportB.certificationCourseId}"]`).hasText(reportB.certificationCourseId.toString());
    });
  });

  module('when feature categorizationOfReports is on', function() {

    test('it shows "1 Signalement" only if there is an examinerComment', async function(assert) {
      // given
      this.set('isReportsCategorizationFeatureToggleEnabled', true);

      // when
      await render(hbs`
        <SessionFinalizationReportsInformationsStep
          @certificationReports={{this.certificationReports}}
          @updateCertificationReportExaminerComment={{this.updateCertificationReportExaminerComment}}
          @examinerCommentMaxLength={{this.examinerCommentMaxLength}}
          @toggleCertificationReportHasSeenEndTestScreen={{this.toggleCertificationReportHasSeenEndTestScreen}}
          @toggleAllCertificationReportsHasSeenEndTestScreen={{this.toggleAllCertificationReportsHasSeenEndTestScreen}}
          @isReportsCategorizationFeatureToggleEnabled={{this.isReportsCategorizationFeatureToggleEnabled}}
        />
      `);
      
      // then
      assert.dom(`[data-test-id="finalization-report-has-examiner-comment_${reportA.certificationCourseId}"]`).hasText('1 signalement');
      assert.dom(`[data-test-id="finalization-report-has-examiner-comment_${reportB.certificationCourseId}"]`).doesNotExist();
    });
  });
});
