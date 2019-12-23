const _ = require('lodash');
const Bookshelf = require('../bookshelf');
const CertificationCandidateBookshelf = require('../data/certification-candidate');
const bookshelfToDomainConverter = require('../../infrastructure/utils/bookshelf-to-domain-converter');
const { PGSQL_UNIQUE_CONSTRAINT_VIOLATION_ERROR } = require('../../../db/pgsql-errors');
const {
  NotFoundError,
  CertificationCandidateCreationOrUpdateError,
  CertificationCandidateDeletionError,
  CertificationCandidateMultipleUserLinksWithinSessionError,
} = require('../../domain/errors');

module.exports = {

  save(certificationCandidateToSave) {
    const certificationCandidateBookshelf = new CertificationCandidateBookshelf(_adaptModelToDb(certificationCandidateToSave));

    return certificationCandidateBookshelf.save()
      .then((savedCertificationCandidate) => bookshelfToDomainConverter.buildDomainObject(CertificationCandidateBookshelf, savedCertificationCandidate))
      .catch((bookshelfError) => {
        if (bookshelfError.code === PGSQL_UNIQUE_CONSTRAINT_VIOLATION_ERROR) {
          throw new CertificationCandidateMultipleUserLinksWithinSessionError('A user cannot be linked to several certification candidates within the same session');
        }

        throw new CertificationCandidateCreationOrUpdateError('An error occurred while saving the certification candidate');
      });
  },

  async finalizeAll(certificationCandidates) {
    try {
      await Bookshelf.transaction((trx) => {
        return Promise.all(certificationCandidates.map((certificationCandidate) => {
          return this.finalize({ certificationCandidate, transaction: trx });
        }));
      });
    } catch (err) {
      throw new CertificationCandidateCreationOrUpdateError('An error occurred while finalizing the certification candidates');
    }
  },

  async finalize({ certificationCandidate, transaction = undefined }) {
    const saveOptions = { patch: true, method: 'update' };
    if (transaction) {
      saveOptions.transacting = transaction;
    }

    const candidateDataToUpdate = _.pick(certificationCandidate, [
      'hasSeenEndTestScreen',
      'examinerComment',
    ]);
    return new CertificationCandidateBookshelf({ id: certificationCandidate.id })
      .save(candidateDataToUpdate, saveOptions);
  },

  delete(certificationCandidateId) {
    return CertificationCandidateBookshelf
      .where({ id: certificationCandidateId })
      .destroy({ require: true })
      .then((destroyedCertificationCandidate) => {
        return bookshelfToDomainConverter.buildDomainObject(CertificationCandidateBookshelf, destroyedCertificationCandidate);
      })
      .catch(() => {
        throw new CertificationCandidateDeletionError('An error occurred while deleting the certification candidate');
      });
  },

  getBySessionIdAndUserId({ sessionId, userId }) {
    return CertificationCandidateBookshelf
      .where({ sessionId, userId })
      .fetch({ require: true })
      .then((result) => bookshelfToDomainConverter.buildDomainObject(CertificationCandidateBookshelf, result))
      .catch((error) => {
        if (error instanceof CertificationCandidateBookshelf.NotFoundError) {
          throw new NotFoundError(`Candidate not found for certification session id ${sessionId} and user id ${userId}`);
        }

        throw error;
      });
  },

  findBySessionId(sessionId) {
    return CertificationCandidateBookshelf
      .where({ sessionId })
      .query((qb) => {
        qb.orderByRaw('LOWER("certification-candidates"."lastName") asc');
        qb.orderByRaw('LOWER("certification-candidates"."firstName") asc');
      })
      .fetchAll()
      .then((results) => bookshelfToDomainConverter.buildDomainObjects(CertificationCandidateBookshelf, results));
  },

  findBySessionIdAndPersonalInfo({ sessionId, firstName, lastName, birthdate }) {
    return CertificationCandidateBookshelf
      .query((qb) => {
        qb.where('sessionId', sessionId);
        qb.whereRaw('LOWER(?)=LOWER(??)', [firstName, 'firstName']);
        qb.whereRaw('LOWER(?)=LOWER(??)', [lastName, 'lastName']);
        qb.where('birthdate', birthdate);
      })
      .fetchAll()
      .then((results) => bookshelfToDomainConverter.buildDomainObjects(CertificationCandidateBookshelf, results));
  },

  findOneBySessionIdAndUserId({ sessionId, userId }) {
    return CertificationCandidateBookshelf
      .where({ sessionId, userId })
      .fetchAll()
      .then((results) => bookshelfToDomainConverter.buildDomainObjects(CertificationCandidateBookshelf, results)[0]);
  },

  async setSessionCandidates(sessionId, certificationCandidates) {
    const certificationCandidatesToInsert = certificationCandidates.map((candidate) => _.omit(candidate, ['createdAt']));

    return Bookshelf.knex.transaction(async (trx) => {
      try {
        await trx('certification-candidates')
          .where({ sessionId })
          .del();
      } catch (err) {
        throw new CertificationCandidateDeletionError('An error occurred while deleting the certification candidates during the replacement operation');
      }

      try {
        await trx.batchInsert('certification-candidates', certificationCandidatesToInsert).transacting(trx);
      } catch (err) {
        throw new CertificationCandidateCreationOrUpdateError('An error occurred while inserting the certification candidates during the replacement operation');
      }
    });
  },

  async doesLinkedCertificationCandidateInSessionExist({ sessionId }) {
    const anyLinkedCandidateInSession = await CertificationCandidateBookshelf
      .query({
        where: { sessionId },
        whereNotNull: 'userId',
      }).fetch({ columns: 'id' });

    return anyLinkedCandidateInSession !== null;
  },

};

function _adaptModelToDb(certificationCandidateToSave) {
  return _.omit(certificationCandidateToSave, ['createdAt']);
}
