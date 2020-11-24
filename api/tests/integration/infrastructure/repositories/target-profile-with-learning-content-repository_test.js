const { expect, databaseBuilder, mockLearningContent, domainBuilder, catchErr } = require('../../../test-helper');
const TargetProfileWithLearningContent = require('../../../../lib/domain/models/TargetProfileWithLearningContent');
const targetProfileWithLearningContentRepository = require('../../../../lib/infrastructure/repositories/target-profile-with-learning-content-repository');
const { ENGLISH_SPOKEN } = require('../../../../lib/domain/constants').LOCALE;
const { NotFoundError } = require('../../../../lib/domain/errors');

describe('Integration | Repository | Target-profile-with-learning-content', () => {

  describe('#getWithBadges', () => {

    it('should return target profile with learning content', async () => {
      // given
      const skill1_1_1_2 = domainBuilder.buildTargetedSkill({
        id: 'recArea1_Competence1_Tube1_Skill2',
        name: 'skill1_1_1_2_name',
        tubeId: 'recArea1_Competence1_Tube1',
      });
      const skill1_2_1_1 = domainBuilder.buildTargetedSkill({
        id: 'recArea1_Competence2_Tube1_Skill1',
        name: 'skill1_2_1_1_name',
        tubeId: 'recArea1_Competence2_Tube1',
      });
      const tube1_1_1 = domainBuilder.buildTargetedTube({
        id: 'recArea1_Competence1_Tube1',
        practicalTitle: 'tube1_1_1_practicalTitle',
        competenceId: 'recArea1_Competence1',
        skills: [skill1_1_1_2],
      });
      const tube1_2_1 = domainBuilder.buildTargetedTube({
        id: 'recArea1_Competence2_Tube1',
        practicalTitle: 'tube1_2_1_practicalTitle',
        competenceId: 'recArea1_Competence2',
        skills: [skill1_2_1_1],
      });
      const competence1_1 = domainBuilder.buildTargetedCompetence({
        id: 'recArea1_Competence1',
        name: 'competence1_1_name',
        index: 'competence1_1_index',
        areaId: 'recArea1',
        tubes: [tube1_1_1],
      });
      const competence1_2 = domainBuilder.buildTargetedCompetence({
        id: 'recArea1_Competence2',
        name: 'competence1_2_name',
        index: 'competence1_2_index',
        areaId: 'recArea1',
        tubes: [tube1_2_1],
      });
      const area1 = domainBuilder.buildTargetedArea({
        id: 'recArea1',
        title: 'area1_Title',
        competences: [competence1_1, competence1_2],
      });
      const targetProfileDB = databaseBuilder.factory.buildTargetProfile();
      databaseBuilder.factory.buildTargetProfileSkill({ targetProfileId: targetProfileDB.id, skillId: 'recArea1_Competence1_Tube1_Skill2' });
      databaseBuilder.factory.buildTargetProfileSkill({ targetProfileId: targetProfileDB.id, skillId: 'recArea1_Competence2_Tube1_Skill1' });
      const expectedTargetProfile = domainBuilder.buildTargetProfileWithLearningContent({
        id: targetProfileDB.id,
        name: targetProfileDB.name,
        skills: [skill1_1_1_2, skill1_2_1_1],
        tubes: [tube1_1_1, tube1_2_1],
        competences: [competence1_1, competence1_2],
        areas: [area1],
      });

      const learningContent = {
        areas: [{
          id: 'recArea1',
          titleFrFr: 'area1_Title',
          color: 'someColor',
          competenceIds: ['recArea1_Competence1', 'recArea1_Competence2'],
        }],
        competences: [{
          id: 'recArea1_Competence1',
          nameFrFr: 'competence1_1_name',
          index: 'competence1_1_index',
          areaId: 'recArea1',
          skillIds: ['recArea1_Competence1_Tube1_Skill2'],
          origin: 'Pix',
        }, {
          id: 'recArea1_Competence2',
          nameFrFr: 'competence1_2_name',
          index: 'competence1_2_index',
          areaId: 'recArea1',
          skillIds: ['recArea1_Competence2_Tube1_Skill1'],
          origin: 'Pix',
        }],
        tubes: [{
          id: 'recArea1_Competence1_Tube1',
          competenceId: 'recArea1_Competence1',
          practicalTitleFrFr: 'tube1_1_1_practicalTitle',
        }, {
          id: 'recArea1_Competence2_Tube1',
          competenceId: 'recArea1_Competence2',
          practicalTitleFrFr: 'tube1_2_1_practicalTitle',
        }],
        skills: [{
          id: 'recArea1_Competence1_Tube1_Skill2',
          name: 'skill1_1_1_2_name',
          status: 'actif',
          tubeId: 'recArea1_Competence1_Tube1',
          competenceId: 'recArea1_Competence1',
          tutorialIds: [],
        }, {
          id: 'recArea1_Competence2_Tube1_Skill1',
          name: 'skill1_2_1_1_name',
          status: 'actif',
          tubeId: 'recArea1_Competence2_Tube1',
          competenceId: 'recArea1_Competence2',
          tutorialIds: [],
        }],
      };

      mockLearningContent(learningContent);
      await databaseBuilder.commit();

      // when
      const targetProfile = await targetProfileWithLearningContentRepository.getWithBadges({ id: targetProfileDB.id });

      // then
      expect(targetProfile).to.be.instanceOf(TargetProfileWithLearningContent);
      expect(targetProfile).to.deep.equal(expectedTargetProfile);
    });

    it('should return target profile with badges', async () => {
      // given
      const skill1_1_1_1 = domainBuilder.buildTargetedSkill({
        id: 'recArea1_Competence1_Tube1_Skill1',
        tubeId: 'recArea1_Competence1_Tube1',
      });
      const tube1_1_1 = domainBuilder.buildTargetedTube({
        id: 'recArea1_Competence1_Tube1',
        competenceId: 'recArea1_Competence1',
        skills: [skill1_1_1_1],
      });
      const competence1_1 = domainBuilder.buildTargetedCompetence({
        id: 'recArea1_Competence1',
        areaId: 'recArea1',
        tubes: [tube1_1_1],
      });
      const area1 = domainBuilder.buildTargetedArea({
        id: 'recArea1',
        competences: [competence1_1],
      });
      const targetProfileDB = databaseBuilder.factory.buildTargetProfile();
      databaseBuilder.factory.buildTargetProfileSkill({ targetProfileId: targetProfileDB.id, skillId: 'recArea1_Competence1_Tube1_Skill1' });
      const badge1 = databaseBuilder.factory.buildBadge({ targetProfileId: targetProfileDB.id });
      const badge2 = databaseBuilder.factory.buildBadge({ targetProfileId: targetProfileDB.id });
      const expectedTargetProfile = domainBuilder.buildTargetProfileWithLearningContent({
        id: targetProfileDB.id,
        name: targetProfileDB.name,
        skills: [skill1_1_1_1],
        tubes: [tube1_1_1],
        competences: [competence1_1],
        areas: [area1],
        badges: [badge1.title, badge2.title],
      });

      const learningContent = {
        areas: [{
          id: 'recArea1',
          titleFrFr: 'someTitle',
          color: 'someColor',
          competenceIds: ['recArea1_Competence1'],
        }],
        competences: [{
          id: 'recArea1_Competence1',
          nameFrFr: 'someName',
          index: 'someIndex',
          areaId: 'recArea1',
          skillIds: ['recArea1_Competence1_Tube1_Skill1'],
          origin: 'Pix',
        }],
        tubes: [{
          id: 'recArea1_Competence1_Tube1',
          competenceId: 'recArea1_Competence1',
          practicalTitleFrFr: 'somePracticalTitle',
        }],
        skills: [{
          id: 'recArea1_Competence1_Tube1_Skill1',
          name: 'someSkillName5',
          status: 'actif',
          tubeId: 'recArea1_Competence1_Tube1',
          competenceId: 'recArea1_Competence1',
          tutorialIds: [],
        }],
      };

      mockLearningContent(learningContent);
      await databaseBuilder.commit();

      // when
      const targetProfile = await targetProfileWithLearningContentRepository.getWithBadges({ id: targetProfileDB.id });

      // then
      expect(targetProfile).to.be.instanceOf(TargetProfileWithLearningContent);
      expect(targetProfile).to.deep.equal(expectedTargetProfile);
    });

    it('should return target profile filled with objects with appropriate translation', async () => {
      // given
      const targetProfileDB = databaseBuilder.factory.buildTargetProfile();
      const expectedTargetProfile = domainBuilder.buildTargetProfileWithLearningContent.withSimpleLearningContent({
        id: targetProfileDB.id,
        name: targetProfileDB.name,
      });
      databaseBuilder.factory.buildTargetProfileSkill({ targetProfileId: targetProfileDB.id, skillId: expectedTargetProfile.skills[0].id });

      const learningContent = {
        areas: [{
          id: 'areaId',
          titleEnUs: 'someTitle',
          color: 'someColor',
          competenceIds: ['competenceId'],
        }],
        competences: [{
          id: 'competenceId',
          nameEnUs: 'someName',
          index: 'someIndex',
          areaId: 'areaId',
          skillIds: ['skillId'],
          origin: 'Pix',
        }],
        tubes: [{
          id: 'tubeId',
          competenceId: 'competenceId',
          practicalTitleEnUs: 'somePracticalTitle',
        }],
        skills: [{
          id: 'skillId',
          name: 'someSkillName5',
          status: 'actif',
          tubeId: 'tubeId',
          competenceId: 'competenceId',
          tutorialIds: [],
        }],
      };
      mockLearningContent(learningContent);
      await databaseBuilder.commit();

      // when
      const targetProfile = await targetProfileWithLearningContentRepository.getWithBadges({ id: targetProfileDB.id, locale: ENGLISH_SPOKEN });

      // then
      expect(targetProfile).to.be.instanceOf(TargetProfileWithLearningContent);
      expect(targetProfile).to.deep.equal(expectedTargetProfile);
    });

    it('should throw a NotFoundError when targetProfile does not exists', async () => {
      // when
      const error = await catchErr(targetProfileWithLearningContentRepository.getWithBadges)({ id: 123 });

      // then
      expect(error).to.be.instanceOf(NotFoundError);
    });
  });

  describe('#getByCampaignId', () => {

    it('should return target profile with learning content', async () => {
      // given
      const skill1_1_1_2 = domainBuilder.buildTargetedSkill({
        id: 'recArea1_Competence1_Tube1_Skill2',
        name: 'skill1_1_1_2_name',
        tubeId: 'recArea1_Competence1_Tube1',
      });
      const skill1_2_1_1 = domainBuilder.buildTargetedSkill({
        id: 'recArea1_Competence2_Tube1_Skill1',
        name: 'skill1_2_1_1_name',
        tubeId: 'recArea1_Competence2_Tube1',
      });
      const tube1_1_1 = domainBuilder.buildTargetedTube({
        id: 'recArea1_Competence1_Tube1',
        practicalTitle: 'tube1_1_1_practicalTitle',
        competenceId: 'recArea1_Competence1',
        skills: [skill1_1_1_2],
      });
      const tube1_2_1 = domainBuilder.buildTargetedTube({
        id: 'recArea1_Competence2_Tube1',
        practicalTitle: 'tube1_2_1_practicalTitle',
        competenceId: 'recArea1_Competence2',
        skills: [skill1_2_1_1],
      });
      const competence1_1 = domainBuilder.buildTargetedCompetence({
        id: 'recArea1_Competence1',
        name: 'competence1_1_name',
        index: 'competence1_1_index',
        areaId: 'recArea1',
        tubes: [tube1_1_1],
      });
      const competence1_2 = domainBuilder.buildTargetedCompetence({
        id: 'recArea1_Competence2',
        name: 'competence1_2_name',
        index: 'competence1_2_index',
        areaId: 'recArea1',
        tubes: [tube1_2_1],
      });
      const area1 = domainBuilder.buildTargetedArea({
        id: 'recArea1',
        title: 'area1_Title',
        competences: [competence1_1, competence1_2],
      });
      const targetProfileDB = databaseBuilder.factory.buildTargetProfile();
      databaseBuilder.factory.buildTargetProfileSkill({ targetProfileId: targetProfileDB.id, skillId: 'recArea1_Competence1_Tube1_Skill2' });
      databaseBuilder.factory.buildTargetProfileSkill({ targetProfileId: targetProfileDB.id, skillId: 'recArea1_Competence2_Tube1_Skill1' });
      const campaignId = databaseBuilder.factory.buildCampaign({ targetProfileId: targetProfileDB.id }).id;
      const expectedTargetProfile = domainBuilder.buildTargetProfileWithLearningContent({
        id: targetProfileDB.id,
        name: targetProfileDB.name,
        skills: [skill1_1_1_2, skill1_2_1_1],
        tubes: [tube1_1_1, tube1_2_1],
        competences: [competence1_1, competence1_2],
        areas: [area1],
      });
      const learningContent = {
        areas: [{
          id: 'recArea1',
          titleFrFr: 'area1_Title',
          color: 'someColor',
          competenceIds: ['recArea1_Competence1', 'recArea1_Competence2'],
        }],
        competences: [{
          id: 'recArea1_Competence1',
          nameFrFr: 'competence1_1_name',
          index: 'competence1_1_index',
          areaId: 'recArea1',
          skillIds: ['recArea1_Competence1_Tube1_Skill2'],
          origin: 'Pix',
        }, {
          id: 'recArea1_Competence2',
          nameFrFr: 'competence1_2_name',
          index: 'competence1_2_index',
          areaId: 'recArea1',
          skillIds: ['recArea1_Competence2_Tube1_Skill1'],
          origin: 'Pix',
        }],
        tubes: [{
          id: 'recArea1_Competence1_Tube1',
          competenceId: 'recArea1_Competence1',
          practicalTitleFrFr: 'tube1_1_1_practicalTitle',
        }, {
          id: 'recArea1_Competence2_Tube1',
          competenceId: 'recArea1_Competence2',
          practicalTitleFrFr: 'tube1_2_1_practicalTitle',
        }],
        skills: [{
          id: 'recArea1_Competence1_Tube1_Skill2',
          name: 'skill1_1_1_2_name',
          status: 'actif',
          tubeId: 'recArea1_Competence1_Tube1',
          competenceId: 'recArea1_Competence1',
          tutorialIds: [],
        }, {
          id: 'recArea1_Competence2_Tube1_Skill1',
          name: 'skill1_2_1_1_name',
          status: 'actif',
          tubeId: 'recArea1_Competence2_Tube1',
          competenceId: 'recArea1_Competence2',
          tutorialIds: [],
        }],
      };

      mockLearningContent(learningContent);
      await databaseBuilder.commit();

      // when
      const targetProfile = await targetProfileWithLearningContentRepository.getByCampaignId({ campaignId });

      // then
      expect(targetProfile).to.be.instanceOf(TargetProfileWithLearningContent);
      expect(targetProfile).to.deep.equal(expectedTargetProfile);
    });

    it('should return target profile filled with objects with appropriate translation', async () => {
      // given
      const targetProfileDB = databaseBuilder.factory.buildTargetProfile();
      const expectedTargetProfile = domainBuilder.buildTargetProfileWithLearningContent.withSimpleLearningContent({
        id: targetProfileDB.id,
        name: targetProfileDB.name,
      });
      databaseBuilder.factory.buildTargetProfileSkill({ targetProfileId: targetProfileDB.id, skillId: expectedTargetProfile.skills[0].id });
      const campaignId = databaseBuilder.factory.buildCampaign({ targetProfileId: targetProfileDB.id }).id;
      const learningContent = {
        areas: [{
          id: 'areaId',
          titleEnUs: 'someTitle',
          color: 'someColor',
          competenceIds: ['competenceId'],
        }],
        competences: [{
          id: 'competenceId',
          nameEnUs: 'someName',
          index: 'someIndex',
          areaId: 'areaId',
          skillIds: ['skillId'],
          origin: 'Pix',
        }],
        tubes: [{
          id: 'tubeId',
          competenceId: 'competenceId',
          practicalTitleEnUs: 'somePracticalTitle',
        }],
        skills: [{
          id: 'skillId',
          name: 'someSkillName5',
          status: 'actif',
          tubeId: 'tubeId',
          competenceId: 'competenceId',
          tutorialIds: [],
        }],
      };
      mockLearningContent(learningContent);
      await databaseBuilder.commit();

      // when
      const targetProfile = await targetProfileWithLearningContentRepository.getByCampaignId({ campaignId, locale: ENGLISH_SPOKEN });

      // then
      expect(targetProfile).to.be.instanceOf(TargetProfileWithLearningContent);
      expect(targetProfile).to.deep.equal(expectedTargetProfile);
    });

    it('should throw a NotFoundError when targetProfile cannot be found', async () => {
      // when
      const error = await catchErr(targetProfileWithLearningContentRepository.getByCampaignId)({ campaignId: 123 });

      // then
      expect(error).to.be.instanceOf(NotFoundError);
    });
  });
});
