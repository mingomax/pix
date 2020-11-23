const utils = require('./solution-service-utils');
const deactivationsService = require('../../../lib/domain/services/deactivations-service');
const { isNumeric, splitIntoWordsAndRemoveBackspaces } = require('../../../lib/infrastructure/utils/string-utils');
const { includes, isEmpty, isString, map } = require('lodash');
const {
  normalizeAndRemoveAccents,
  removeSpecialCharacters,
  applyPreTreatments,
} = require('./validation-treatments');

const AnswerStatus = require('../models/AnswerStatus');

module.exports = {

  match(answer, solution, deactivations) {

    const isIncorrectAnswerFormat = !isString(answer);
    const isIncorrectSolutionFormat = !isString(solution) || isEmpty(solution);

    if (isIncorrectAnswerFormat || isIncorrectSolutionFormat) {
      return AnswerStatus.KO;
    }

    if (isNumeric(answer) && isNumeric(solution)) {
      return _getAnswerStatusFromNumberMatching(answer, solution);
    }

    return _getAnswerStatusFromStringMatching(answer, solution, deactivations);
  },
};

function _getAnswerStatusFromNumberMatching(answer, solution) {
  if (parseFloat(answer) === parseFloat(solution)) {
    return AnswerStatus.OK;
  }
  return AnswerStatus.KO;
}

function _getAnswerStatusFromStringMatching(answer, solution, deactivations) {
  const treatedAnswer = applyPreTreatments(answer);
  const treatedSolutions = _applyTreatmentsToSolutions(solution, deactivations);
  const validations = utils.treatmentT1T2T3(treatedAnswer, treatedSolutions);
  return _getAnswerStatusAccordingToLevenshteinDistance(validations, deactivations);
}

function _applyTreatmentsToSolutions(solution, deactivations) {
  const pretreatedSolutions = splitIntoWordsAndRemoveBackspaces(solution);
  return map(pretreatedSolutions, (pretreatedSolution) => {

    if (deactivationsService.isDefault(deactivations)) {
      const normalizedWithoutAccentsSolution = normalizeAndRemoveAccents(pretreatedSolution);
      return removeSpecialCharacters(normalizedWithoutAccentsSolution);
    }
    else if (deactivationsService.hasOnlyT1(deactivations)) {
      return removeSpecialCharacters(pretreatedSolution);
    }
    else if (deactivationsService.hasOnlyT2(deactivations)) {
      return normalizeAndRemoveAccents(pretreatedSolution);
    }
    else if (deactivationsService.hasOnlyT3(deactivations)) {
      const normalizedWithoutAccentsSolution = normalizeAndRemoveAccents(pretreatedSolution);
      return removeSpecialCharacters(normalizedWithoutAccentsSolution);
    }
    else if (deactivationsService.hasOnlyT1T2(deactivations)) {
      return pretreatedSolution;
    }
    else if (deactivationsService.hasOnlyT1T3(deactivations)) {
      return removeSpecialCharacters(pretreatedSolution);
    }
    else if (deactivationsService.hasOnlyT2T3(deactivations)) {
      return normalizeAndRemoveAccents(pretreatedSolution);
    }
    else if (deactivationsService.hasT1T2T3(deactivations)) {
      return pretreatedSolution;
    }
  });
}

function _getAnswerStatusAccordingToLevenshteinDistance(validations, deactivations) {

  if (deactivationsService.isDefault(deactivations)) {
    if (validations.t1t2t3Ratio <= 0.25) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
  else if (deactivationsService.hasOnlyT1(deactivations)) {
    if (validations.t2t3Ratio <= 0.25) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
  else if (deactivationsService.hasOnlyT2(deactivations)) {
    if (validations.t1t3Ratio <= 0.25) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
  else if (deactivationsService.hasOnlyT3(deactivations)) {
    if (includes(validations.adminAnswers, validations.t1t2)) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
  else if (deactivationsService.hasOnlyT1T2(deactivations)) {
    if (validations.t3Ratio <= 0.25) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
  else if (deactivationsService.hasOnlyT1T3(deactivations)) {
    if (includes(validations.adminAnswers, validations.t2)) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
  else if (deactivationsService.hasOnlyT2T3(deactivations)) {
    if (includes(validations.adminAnswers, validations.t1)) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
  else if (deactivationsService.hasT1T2T3(deactivations)) {
    if (includes(validations.adminAnswers, validations.userAnswer)) {
      return AnswerStatus.OK;
    }
    return AnswerStatus.KO;
  }
}
