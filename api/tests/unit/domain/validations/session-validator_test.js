const { expect, domainBuilder, catchErr } = require('../../../test-helper');
const { statuses } = require('../../../../lib/domain/models/Session');
const { EntityValidationError } = require('../../../../lib/domain/errors');
const sessionValidator = require('../../../../lib/domain/validators/session-validator');

const MISSING_VALUE = '';

describe('Unit | Domain | Validators | session-validator', () => {

  let session;

  beforeEach(() => {
    session = domainBuilder.buildSession({
      address: '51 rue des lillas',
      room: 'Salle John Doe',
      date: '2000-10-20',
      time: '14:30',
      examiner: 'Mister T',
    });
  });

  describe('#validate', () => {

    context('when validation is successful', () => {

      it('should not throw any error', () => {
        expect(sessionValidator.validate(session)).to.not.throw;
      });

    });

    context('when session data validation fails', () => {

      context('on address attribute', () => {

        it('should reject with error when address is missing', () => {
          // given
          const expectedErrors = [{
            attribute: 'address',
            message: 'Veuillez donner un nom de site.'
          }];
          session.address = MISSING_VALUE;

          try {
            // when
            sessionValidator.validate(session);
            expect.fail('should have thrown an error');
          } catch (entityValidationErrors) {
            // then
            expect(entityValidationErrors).with.deep.property('invalidAttributes', expectedErrors);
          }
        });

      });

      context('on room attribute', () => {

        it('should reject with error when room is missing', async  () => {
          // given
          const expectedErrors = [{
            attribute: 'room',
            message: 'Veuillez donner un nom de salle.'
          }];
          session.room = MISSING_VALUE;

          try {
            // when
            sessionValidator.validate(session);
            expect.fail('should have thrown an error');
          } catch (entityValidationErrors) {
            // then
            expect(entityValidationErrors).with.deep.property('invalidAttributes', expectedErrors);
          }
        });

      });

      context('on date attribute', () => {

        it('should reject with error when date is missing', () => {
          // given
          const expectedErrors = [{
            attribute: 'date',
            message: 'Veuillez indiquer une date de début.'
          }];
          session.date = MISSING_VALUE;

          try {
            // when
            sessionValidator.validate(session);
            expect.fail('should have thrown an error');
          } catch (entityValidationErrors) {
            // then
            expect(entityValidationErrors).with.deep.property('invalidAttributes', expectedErrors);
          }
        });

      });

      context('on time attribute', () => {

        it('should reject with error when time is an empty string', () => {
          // given
          const expectedErrors = [{
            attribute: 'time',
            message: 'Veuillez indiquer une heure de début.'
          }];
          session.time = '';

          try {
            // when
            sessionValidator.validate(session);
            expect.fail('should have thrown an error');
          } catch (entityValidationErrors) {
            // then
            expect(entityValidationErrors).with.deep.property('invalidAttributes', expectedErrors);
          }
        });

        it('should reject with error when time ihas a format different than HH:MM', () => {
          // given
          const expectedErrors = [{
            attribute: 'time',
            message: 'Veuillez indiquer une heure de début.'
          }];
          session.time = '14:23:30';

          try {
            // when
            sessionValidator.validate(session);
            expect.fail('should have thrown an error');
          } catch (entityValidationErrors) {
            // then
            expect(entityValidationErrors).with.deep.property('invalidAttributes', expectedErrors);
          }
        });

      });

      context('on examiner attribute', () => {

        it('should reject with error when examiner is missing', () => {
          // given
          const expectedErrors = [{
            attribute: 'examiner',
            message: 'Veuillez indiquer un(e) surveillant(e).'
          }];
          session.examiner = MISSING_VALUE;

          try {
            // when
            sessionValidator.validate(session);
            expect.fail('should have thrown an error');
          } catch (entityValidationErrors) {
            // then
            expect(entityValidationErrors).with.deep.property('invalidAttributes', expectedErrors);
          }
        });

      });

    });
  });

  describe('#validateFilters', () => {

    context('return value', () => {

      it('should return the filters in a normalized form', () => {
        const value = sessionValidator.validateFilters({
          id: '123',
          status: 'finalized',
        });

        expect(typeof value.id).to.equal('number');
        expect(value.status).to.equal('finalized');
      });
    });

    context('when validating id', () => {

      context('when id not in submitted filters', () => {

        it('should not throw any error', () => {
          expect(sessionValidator.validateFilters({})).to.not.throw;
        });
      });

      context('when id is in submitted filters', () => {

        context('when id is not an integer', () => {

          it('should throw an error', async () => {
            const error = await catchErr(sessionValidator.validateFilters)({ id: 'salut' });
            expect(error).to.be.instanceOf(EntityValidationError);
          });
        });

        context('when id is an integer', () => {

          it('accept a string containing an int', () => {
            expect(sessionValidator.validateFilters({ id: '123' })).to.not.throw;
          });

          it('should not throw any error', () => {
            expect(sessionValidator.validateFilters({ id: 123 })).to.not.throw;
          });
        });
      });

    });

    context('when validating certificationCenterName', () => {

      context('when certificationCenterName not in submitted filters', () => {

        it('should not throw any error', () => {
          expect(sessionValidator.validateFilters({})).to.not.throw;
        });
      });

      context('when certificationCenterName is in submitted filters', () => {

        context('when certificationCenterName is not an string', () => {

          it('should throw an error', async () => {
            const error = await catchErr(sessionValidator.validateFilters)({ certificationCenterName: 123 });
            expect(error).to.be.instanceOf(EntityValidationError);
          });
        });

        context('when certificationCenterName is a string', () => {

          it('should not throw an error', async () => {
            const certificationCenterName = '   Coucou le dév qui lit ce message !   ';
            expect(sessionValidator.validateFilters({ certificationCenterName })).to.not.throw;
            expect(sessionValidator.validateFilters({ certificationCenterName }).certificationCenterName).to.equal(certificationCenterName.trim());
          });
        });
      });

    });

    context('when validating status', () => {

      context('when status not in submitted filters', () => {

        it('should not throw any error', () => {
          expect(sessionValidator.validateFilters({})).to.not.throw;
        });
      });

      context('when status is in submitted filters', () => {

        context('when status is not an string', () => {

          it('should throw an error', async () => {
            const error = await catchErr(sessionValidator.validateFilters)({ status: 123 });
            expect(error).to.be.instanceOf(EntityValidationError);
          });
        });

        context('when status is not in the statuses list', () => {

          it('should throw an error', async () => {
            const error = await catchErr(sessionValidator.validateFilters)({ status: 'SomeOtherStatus' });
            expect(error).to.be.instanceOf(EntityValidationError);
          });
        });

        context('when status is in the statuses list', () => {

          it('should not throw an error', async () => {
            expect(sessionValidator.validateFilters({ status: statuses.CREATED })).to.not.throw;
            expect(sessionValidator.validateFilters({ status: statuses.FINALIZED })).to.not.throw;
            expect(sessionValidator.validateFilters({ status: statuses.IN_PROCESS })).to.not.throw;
            expect(sessionValidator.validateFilters({ status: statuses.PROCESSED })).to.not.throw;
          });
        });
      });

    });

    context('when validating resultsSentToPrescriberAt', () => {

      context('when resultsSentToPrescriberAt not in submitted filters', () => {

        it('should not throw any error', () => {
          expect(sessionValidator.validateFilters({})).to.not.throw;
        });
      });

      context('when resultsSentToPrescriberAt is in submitted filters', () => {

        context('when resultsSentToPrescriberAt is not a boolean', () => {

          it('should throw an error', async () => {
            const error = await catchErr(sessionValidator.validateFilters)({ resultsSentToPrescriberAt: 123 });
            expect(error).to.be.instanceOf(EntityValidationError);
          });
        });

        context('when resultsSentToPrescriberAt is not in the resultsSentToPrescriberAt list', () => {

          it('should throw an error', async () => {
            const error = await catchErr(sessionValidator.validateFilters)({ resultsSentToPrescriberAt: 'SomeOtherValue' });
            expect(error).to.be.instanceOf(EntityValidationError);
          });
        });

        context('when resultsSentToPrescriberAt is a boolean', () => {

          it('should not throw an error', async () => {
            expect(sessionValidator.validateFilters({ resultsSentToPrescriberAt: true })).to.not.throw;
            expect(sessionValidator.validateFilters({ resultsSentToPrescriberAt: false })).to.not.throw;
          });
        });
      });

    });

    context('when validating assignedToSelfOnly', () => {

      context('when assignedToSelfOnly not in submitted filters', () => {

        it('should not throw any error', () => {
          expect(sessionValidator.validateFilters({})).to.not.throw;
        });
      });

      context('when assignedToSelfOnly is in submitted filters', () => {

        context('when assignedToSelfOnly is not an boolean', () => {

          it('should throw an error', async () => {
            const error = await catchErr(sessionValidator.validateFilters)({ assignedToSelfOnly: 'coucou' });
            expect(error).to.be.instanceOf(EntityValidationError);
          });
        });

        context('when assignedToSelfOnly is a boolean string', () => {

          it('should throw an error', async () => {
            expect(sessionValidator.validateFilters({ assignedToSelfOnly: 'true' })).to.not.throw;
            expect(sessionValidator.validateFilters({ assignedToSelfOnly: 'false' })).to.not.throw;
          });
        });

        context('when assignedToSelfOnly is a boolean', () => {

          it('should not throw an error', async () => {
            expect(sessionValidator.validateFilters({ assignedToSelfOnly: true })).to.not.throw;
            expect(sessionValidator.validateFilters({ assignedToSelfOnly: false })).to.not.throw;
          });
        });
      });

    });
  });
});
