const { expect, databaseBuilder } = require('../../test-helper');
const _ = require('lodash');

const KnowledgeElement = require('../../../lib/domain/models/KnowledgeElement');

const {
  findDirectAndHigherLevelKEs,
  // getAllTestedChallenges,
  // mergeTestedChallengesAndKEsByCompetences,
  // mergeCompetencesWithReferentialInfos,
} = require('../../../scripts/helpers/certif/positionned-and-tested-profile-helper');

describe.only('Acceptance | Scripts | create-or-update-sco-organizations.js', () => {

  describe('#findDirectAndHigherLevelKEs', () => {

    // On prend seulement les KE de plus haut niveau ici (pas les inferrés)

    it('should return only direct and higher level knowledge elements', async () => {
      // given
      const userId = databaseBuilder.factory.buildUser({}).id;
      const directKEs = createDirectAndValidKE({ numberOfKe: 4, userId });
      const indirectKEs = createInferredAndValidKE({ numberOfKe: 4, userId });
      await databaseBuilder.commit();

      // when
      const result = await findDirectAndHigherLevelKEs({ userId });

      // then
      const expectedKEs = directKEs;
      expect(result).to.deep.equal(expectedKEs);
    });
  });

});

function createDirectAndValidKE({ numberOfKe, userId }) {
  return createKEs({
    numberOfKe,
    userId,
    source: KnowledgeElement.SourceType.DIRECT,
    status: KnowledgeElement.StatusType.VALIDATED,
  });
}

function createInferredAndValidKE({ numberOfKe, userId }) {
  return createKEs({
    numberOfKe,
    userId,
    source: KnowledgeElement.SourceType.INFERRED,
    status: KnowledgeElement.StatusType.VALIDATED,
  });
}

function createKEs({ numberOfKe, userId, source, status }) {
  const assessmentId = databaseBuilder.factory.buildAssessment({ userId }).id;
  return _.times(numberOfKe, (i) => databaseBuilder.factory.buildKnowledgeElement({
      source,
      status,
      skillId: `${i} skillId`,
      assessmentId,
      answerId: databaseBuilder.factory.buildAnswer().id,
      userId,
      competenceId: `${i} competenceId`,
    })
  );
}
