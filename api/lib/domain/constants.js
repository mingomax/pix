const settings = require('../config');
module.exports = {
  MAX_REACHABLE_LEVEL: 5,
  MAX_REACHABLE_PIX_BY_COMPETENCE: 40,
  PIX_COUNT_BY_LEVEL: 8,
  MAX_CHALLENGES_PER_SKILL_FOR_CERTIFICATION: 3,
  MINIMUM_DELAY_IN_DAYS_FOR_RESET: settings.features.dayBeforeCompetenceResetV2 || 7,
  MINIMUM_CERTIFIABLE_COMPETENCES_FOR_CERTIFIABILITY: 5,
  MINIMUM_COMPETENCE_LEVEL_FOR_CERTIFIABILITY: 1,
  MINIMUM_REPRODUCTIBILITY_RATE_TO_BE_CERTIFIED: 50,
  MINIMUM_REPRODUCTIBILITY_RATE_TO_BE_TRUSTED: 80,
  UNCERTIFIED_LEVEL: -1,
};
