import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import { mapBy, max } from '@ember/object/computed';

export default class CampaignParticipationResult extends Model {

  // attributes
  @attr('number') masteryPercentage;
  @attr('number') totalSkillsCount;
  @attr('number') testedSkillsCount;
  @attr('number') validatedSkillsCount;
  @attr('boolean') areBadgeCriteriaFulfilled;

  // includes
  @belongsTo('badge') badge;
  @hasMany('partnerCompetenceResult') partnerCompetenceResults;
  @hasMany('competenceResult') competenceResults;

  // methods
  @mapBy('competenceResults', 'totalSkillsCount') totalSkillsCounts;
  @mapBy('partnerCompetenceResults', 'totalSkillsCount') totalCompetenceResultSkillsCounts;

  @max('totalSkillsCounts') maxTotalSkillsCountInCompetences;
  @max('totalCompetenceResultSkillsCounts') maxTotalSkillsCountInPartnerCompetences;
}