const { expect, domainBuilder } = require('../../../test-helper');
const CampaignAssessmentCsvLine = require('../../../../lib/infrastructure/utils/CampaignAssessmentCsvLine');
const campaignParticipationService = require('../../../../lib/domain/services/campaign-participation-service');
const KnowledgeElement = require('../../../../lib/domain/models/KnowledgeElement');

function _computeExpectedColumns(campaign, organization) {
  const studentNumberPresenceModifier = (organization.type === 'SUP' && organization.isManagingStudents) ? 1 : 0;
  const externalIdPresenceModifier = campaign.idPixLabel ? 1 : 0;

  return {
    ORGANIZATION_NAME: 0,
    CAMPAIGN_ID: 1,
    CAMPAIGN_NAME: 2,
    TARGET_PROFILE_NAME: 3,
    PARTICIPANT_LAST_NAME: 4,
    PARTICIPANT_FIRST_NAME: 5,
    STUDENT_NUMBER_COL: 6,
    EXTERNAL_ID: 6 + studentNumberPresenceModifier,
    PARTICIPATION_PROGRESSION: 6 + studentNumberPresenceModifier + externalIdPresenceModifier,
    PARTICIPATION_CREATED_AT: 7 + studentNumberPresenceModifier + externalIdPresenceModifier,
    PARTICIPATION_IS_SHARED: 8 + studentNumberPresenceModifier + externalIdPresenceModifier,
    PARTICIPATION_SHARED_AT: 9 + studentNumberPresenceModifier + externalIdPresenceModifier,
    PARTICIPATION_PERCENTAGE: 10 + studentNumberPresenceModifier + externalIdPresenceModifier,
    DETAILS_START: 11 + studentNumberPresenceModifier + externalIdPresenceModifier,
  };
}

describe('Unit | Infrastructure | Utils | CampaignAssessmentCsvLine', () => {

  describe('#toCsvLine', () => {

    it('should return common info', () => {
      // given
      const organization = domainBuilder.buildOrganization({ isManagingStudents: false });
      const campaign = domainBuilder.buildCampaign({ idPixLabel: null });
      const campaignParticipationInfo = domainBuilder.buildCampaignParticipationInfo({ createdAt: new Date('2020-01-01'), isCompleted: false });
      const skill = domainBuilder.buildSkill({ id: 'recSkill', competenceId: 'recCompetence1' });
      const targetProfile = domainBuilder.buildTargetProfile({ skills: [skill] });
      const campaignAssessmentCsvLine = new CampaignAssessmentCsvLine({
        organization,
        campaign,
        areas: [],
        competences: [],
        campaignParticipationInfo,
        targetProfile,
        participantKnowledgeElementsByCompetenceId: [],
        campaignParticipationService,
      });

      // when
      const csvLine = campaignAssessmentCsvLine.toCsvLine();

      // then
      const cols = _computeExpectedColumns(campaign, organization);
      expect(csvLine[cols.ORGANIZATION_NAME], 'organization name').to.equal(organization.name);
      expect(csvLine[cols.CAMPAIGN_ID], 'campaign id').to.equal(campaign.id);
      expect(csvLine[cols.CAMPAIGN_NAME], 'campaign name').to.equal(campaign.name);
      expect(csvLine[cols.TARGET_PROFILE_NAME], 'target profile name').to.equal(targetProfile.name);
      expect(csvLine[cols.PARTICIPANT_LAST_NAME], 'participant last name').to.equal(campaignParticipationInfo.participantLastName);
      expect(csvLine[cols.PARTICIPANT_FIRST_NAME], 'participant first name').to.equal(campaignParticipationInfo.participantFirstName);
      expect(csvLine[cols.PARTICIPATION_CREATED_AT], 'participant created at').to.equal('2020-01-01');
      expect(csvLine[cols.PARTICIPATION_PROGRESSION], 'participation progression').to.equal(0);
    });

    context('on student number column', () => {
      it('should write the student number when organization is of type SUP and campaign is restricted', () => {
        // given
        const organization = domainBuilder.buildOrganization({ type: 'SUP', isManagingStudents: true });
        const campaign = domainBuilder.buildCampaign({ idPixLabel: null });
        const campaignParticipationInfo = domainBuilder.buildCampaignParticipationInfo({ studentNumber: 'someStudentNumber' });
        const targetProfile = domainBuilder.buildTargetProfile({ skills: [] });
        const campaignAssessmentCsvLine = new CampaignAssessmentCsvLine({
          organization,
          campaign,
          areas: [],
          competences: [],
          campaignParticipationInfo,
          targetProfile,
          participantKnowledgeElementsByCompetenceId: [],
          campaignParticipationService,
        });

        // when
        const csvLine = campaignAssessmentCsvLine.toCsvLine();

        // then
        const cols = _computeExpectedColumns(campaign, organization);
        expect(csvLine[cols.STUDENT_NUMBER_COL], 'student number').to.equal(campaignParticipationInfo.studentNumber);
      });
    });

    context('on external id column', () => {

      it('should write the participantExternalId when campaign has an idPixLabel', () => {
        // given
        const organization = domainBuilder.buildOrganization({ isManagingStudents: false });
        const campaign = domainBuilder.buildCampaign({ idPixLabel: 'I Have One !' });
        const campaignParticipationInfo = domainBuilder.buildCampaignParticipationInfo({ participantExternalId: 'someParticipantExternalId' });
        const targetProfile = domainBuilder.buildTargetProfile({ skills: [] });
        const campaignAssessmentCsvLine = new CampaignAssessmentCsvLine({
          organization,
          campaign,
          areas: [],
          competences: [],
          campaignParticipationInfo,
          targetProfile,
          participantKnowledgeElementsByCompetenceId: [],
          campaignParticipationService,
        });

        // when
        const csvLine = campaignAssessmentCsvLine.toCsvLine();

        // then
        const cols = _computeExpectedColumns(campaign, organization);
        expect(csvLine[cols.EXTERNAL_ID], 'external id').to.equal(campaignParticipationInfo.participantExternalId);
      });

      it('should write the participantExternalId aside with the student number if student number is required', () => {
        // given
        const organization = domainBuilder.buildOrganization({ type: 'SUP', isManagingStudents: true });
        const campaign = domainBuilder.buildCampaign({ idPixLabel: 'I Have One !' });
        const campaignParticipationInfo = domainBuilder.buildCampaignParticipationInfo({ studentNumber: 'someStudentNumber', participantExternalId: 'someParticipantExternalId' });
        const targetProfile = domainBuilder.buildTargetProfile({ skills: [] });
        const campaignAssessmentCsvLine = new CampaignAssessmentCsvLine({
          organization,
          campaign,
          areas: [],
          competences: [],
          campaignParticipationInfo,
          targetProfile,
          participantKnowledgeElementsByCompetenceId: [],
          campaignParticipationService,
        });

        // when
        const csvLine = campaignAssessmentCsvLine.toCsvLine();

        // then
        const cols = _computeExpectedColumns(campaign, organization);
        expect(csvLine[cols.EXTERNAL_ID], 'external id').to.equal(campaignParticipationInfo.participantExternalId);
        expect(csvLine[cols.STUDENT_NUMBER_COL], 'student number').to.equal(campaignParticipationInfo.studentNumber);
      });
    });

    context('when participation is not shared', () => {
      it('should show appropriate content for not shared participation', () => {
        // given
        const organization = domainBuilder.buildOrganization();
        const campaign = domainBuilder.buildCampaign({ idPixLabel: null });
        const campaignParticipationInfo = domainBuilder.buildCampaignParticipationInfo({ sharedAt: null });
        const skill1_1 = domainBuilder.buildSkill({ id: 'recSkill1_1', competenceId: 'recCompetence1' });
        const skill2_1 = domainBuilder.buildSkill({ id: 'recSkill2_1', competenceId: 'recCompetence2' });
        const skill2_2 = domainBuilder.buildSkill({ id: 'recSkill2_2', competenceId: 'recCompetence2' });
        const area1 = domainBuilder.buildArea();
        const area2 = domainBuilder.buildArea();
        const competence1 = domainBuilder.buildCompetence({ id: 'recCompetence1', skillIds: ['recSkill1_1', 'recSkill1_2_not_targeted'], area: area1 });
        const competence2 = domainBuilder.buildCompetence({ id: 'recCompetence2', skillIds: ['recSkill2_1', 'recSkill2_2'], area: area2 });
        const targetProfile = domainBuilder.buildTargetProfile({ skills: [skill1_1, skill2_1, skill2_2] });
        const areas = [area1, area2];
        const competences = [competence1, competence2];
        const campaignAssessmentCsvLine = new CampaignAssessmentCsvLine({
          organization,
          campaign,
          areas,
          competences,
          campaignParticipationInfo,
          targetProfile,
          participantKnowledgeElementsByCompetenceId: [],
          campaignParticipationService,
        });

        // when
        const csvLine = campaignAssessmentCsvLine.toCsvLine();

        // then
        const cols = _computeExpectedColumns(campaign, organization);
        const EMPTY_CONTENT = 'NA';
        expect(csvLine[cols.PARTICIPATION_IS_SHARED], 'is shared').to.equal('Non');
        expect(csvLine[cols.PARTICIPATION_SHARED_AT], 'shared at').to.equal(EMPTY_CONTENT);
        expect(csvLine[cols.PARTICIPATION_PERCENTAGE], 'participation percentage').to.equal(EMPTY_CONTENT);

        let currentColumn = cols.DETAILS_START;
        const STAT_COLS_COUNT = 3;
        for (let i = 0; i < competences.length; ++i) {
          expect(csvLine[currentColumn + i], '% maitrise de la competence').to.equal(EMPTY_CONTENT);
          expect(csvLine[currentColumn + i + 1], 'nb acquis compétence').to.equal(EMPTY_CONTENT);
          expect(csvLine[currentColumn + i + 2], 'nb acquis validés dans la compétence').to.equal(EMPTY_CONTENT);
        }
        currentColumn = currentColumn + competences.length * STAT_COLS_COUNT;

        for (let i = 0; i < areas.length; ++i) {
          expect(csvLine[currentColumn + i], '% maitrise du domaine').to.equal(EMPTY_CONTENT);
          expect(csvLine[currentColumn + i + 1], 'nb acquis domaine').to.equal(EMPTY_CONTENT);
          expect(csvLine[currentColumn + i + 2], 'nb acquis validés dans le domaine').to.equal(EMPTY_CONTENT);
        }
        currentColumn = currentColumn + areas.length * STAT_COLS_COUNT;

        for (let i = 0; i < targetProfile.skills.length; ++i) {
          expect(csvLine[currentColumn + i], 'statut acquis').to.equal(EMPTY_CONTENT);
        }
        currentColumn = currentColumn + targetProfile.skills.length;

        expect(csvLine).to.have.lengthOf(currentColumn);
      });
    });

    context('when participation is shared', () => {
      it('should show appropriate content for shared participation', () => {
        // given
        const organization = domainBuilder.buildOrganization();
        const campaign = domainBuilder.buildCampaign({ idPixLabel: null });
        const campaignParticipationInfo = domainBuilder.buildCampaignParticipationInfo({ sharedAt: new Date('2020-01-01') });
        const skill1_1 = domainBuilder.buildSkill({ id: 'recSkill1_1', competenceId: 'recCompetence1' });
        const skill1_2 = domainBuilder.buildSkill({ id: 'recSkill1_2', competenceId: 'recCompetence1' });
        const skill2_1 = domainBuilder.buildSkill({ id: 'recSkill2_1', competenceId: 'recCompetence2' });
        const skill3_1 = domainBuilder.buildSkill({ id: 'recSkill3_1', competenceId: 'recCompetence3' });
        const skill3_2 = domainBuilder.buildSkill({ id: 'recSkill3_2', competenceId: 'recCompetence3' });
        const area1 = domainBuilder.buildArea();
        const area2 = domainBuilder.buildArea();
        const competence1 = domainBuilder.buildCompetence({ id: 'recCompetence1', skillIds: ['recSkill1_1', 'recSkill1_2', 'recNotTargeted'], area: area1 });
        const competence2 = domainBuilder.buildCompetence({ id: 'recCompetence2', skillIds: ['recSkill2_1'], area: area1 });
        const competence3 = domainBuilder.buildCompetence({ id: 'recCompetence3', skillIds: ['recSkill3_1', 'recSkill3_2'], area: area2 });
        const targetProfile = domainBuilder.buildTargetProfile({ skills: [skill1_1, skill1_2, skill2_1, skill3_1, skill3_2] });
        const areas = [area1, area2];
        const competences = [competence1, competence2, competence3];
        const knowledgeElement1 = domainBuilder.buildKnowledgeElement({
          status: KnowledgeElement.StatusType.VALIDATED,
          earnedPix: skill1_1.pixValue,
          skillId: skill1_1.id,
          competenceId: skill1_1.competenceId,
        });
        const knowledgeElement2 = domainBuilder.buildKnowledgeElement({
          status: KnowledgeElement.StatusType.INVALIDATED,
          earnedPix: skill2_1.pixValue,
          skillId: skill2_1.id,
          competenceId: skill2_1.competenceId,
        });
        const knowledgeElement3 = domainBuilder.buildKnowledgeElement({
          status: KnowledgeElement.StatusType.VALIDATED,
          earnedPix: skill3_1.pixValue,
          skillId: skill3_1.id,
          competenceId: skill3_1.competenceId,
        });
        const knowledgeElement4 = domainBuilder.buildKnowledgeElement({
          status: KnowledgeElement.StatusType.VALIDATED,
          earnedPix: skill3_2.pixValue,
          skillId: skill3_2.id,
          competenceId: skill3_2.competenceId,
        });
        const participantKnowledgeElementsByCompetenceId = {
          'recCompetence1': [knowledgeElement1],
          'recCompetence2': [knowledgeElement2],
          'recCompetence3': [knowledgeElement3, knowledgeElement4],
        };
        const campaignAssessmentCsvLine = new CampaignAssessmentCsvLine({
          organization,
          campaign,
          areas,
          competences,
          campaignParticipationInfo,
          targetProfile,
          participantKnowledgeElementsByCompetenceId,
          campaignParticipationService,
        });

        // when
        const csvLine = campaignAssessmentCsvLine.toCsvLine();

        // then
        const cols = _computeExpectedColumns(campaign, organization);
        expect(csvLine[cols.PARTICIPATION_IS_SHARED], 'is shared').to.equal('Oui');
        expect(csvLine[cols.PARTICIPATION_SHARED_AT], 'shared at').to.equal('2020-01-01');
        expect(csvLine[cols.PARTICIPATION_PERCENTAGE], 'participation percentage').to.equal(0.6);

        let currentColumn = cols.DETAILS_START;
        // First competence
        expect(csvLine[currentColumn++], '% maitrise de la competence').to.equal(0.5);
        expect(csvLine[currentColumn++], 'nb acquis compétence').to.equal(2);
        expect(csvLine[currentColumn++], 'nb acquis validés dans la compétence').to.equal(1);
        // Second competence
        expect(csvLine[currentColumn++], '% maitrise de la competence').to.equal(0);
        expect(csvLine[currentColumn++], 'nb acquis compétence').to.equal(1);
        expect(csvLine[currentColumn++], 'nb acquis validés dans la compétence').to.equal(0);
        // Third competence
        expect(csvLine[currentColumn++], '% maitrise de la competence').to.equal(1);
        expect(csvLine[currentColumn++], 'nb acquis compétence').to.equal(2);
        expect(csvLine[currentColumn++], 'nb acquis validés dans la compétence').to.equal(2);
        // First area
        expect(csvLine[currentColumn++], '% maitrise du domaine').to.equal(0.33);
        expect(csvLine[currentColumn++], 'nb acquis domaine').to.equal(3);
        expect(csvLine[currentColumn++], 'nb acquis validés dans le domaine').to.equal(1);
        // Second area
        expect(csvLine[currentColumn++], '% maitrise du domaine').to.equal(1);
        expect(csvLine[currentColumn++], 'nb acquis domaine').to.equal(2);
        expect(csvLine[currentColumn++], 'nb acquis validés dans le domaine').to.equal(2);
        // Target profile skills
        expect(csvLine[currentColumn++], 'statut acquis').to.equal('OK');
        expect(csvLine[currentColumn++], 'statut acquis').to.equal('Non testé');
        expect(csvLine[currentColumn++], 'statut acquis').to.equal('KO');
        expect(csvLine[currentColumn++], 'statut acquis').to.equal('OK');
        expect(csvLine[currentColumn++], 'statut acquis').to.equal('OK');

        expect(csvLine).to.have.lengthOf(currentColumn);
      });
    });
  });
});