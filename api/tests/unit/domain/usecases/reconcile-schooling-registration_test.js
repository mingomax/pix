const { expect, sinon, domainBuilder, catchErr } = require('../../../test-helper');
const usecases = require('../../../../lib/domain/usecases');
const SchoolingRegistration = require('../../../../lib/domain/models/SchoolingRegistration');
const Student = require('../../../../lib/domain/models/Student');

const { CampaignCodeError, NotFoundError, SchoolingRegistrationAlreadyLinkedToUserError } = require('../../../../lib/domain/errors');

describe('Unit | UseCase | reconcile-schooling-registration', () => {

  let campaignCode;

  let campaignRepository;
  let schoolingRegistrationRepository;
  let studentRepository;
  let userReconciliationService;

  let schoolingRegistration;
  let user;
  const organizationId = 1;
  const schoolingRegistrationId = 1;

  beforeEach(() => {
    campaignCode = 'ABCD12';
    schoolingRegistration = domainBuilder.buildSchoolingRegistration({ organizationId, id: schoolingRegistrationId });
    user = {
      id: 1,
      firstName: 'Joe',
      lastName: 'Poe',
      birthdate: '02/02/1992',
    };

    campaignRepository = {
      getByCode: sinon.stub(),
    };
    schoolingRegistrationRepository = {
      reconcileUserToSchoolingRegistration: sinon.stub(),
    };
    userReconciliationService = {
      findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser: sinon.stub(),
      checkIfStudentHasAlreadyAccountsReconciledInOtherOrganizations: sinon.stub(),
    };
    studentRepository = {
      getReconciledStudentByNationalStudentId: sinon.stub(),
    };
  });

  context('When there is no campaign with the given code', () => {

    it('should throw a campaign code error', async () => {
      // given
      campaignRepository.getByCode.withArgs(campaignCode).resolves(null);

      // when
      const result = await catchErr(usecases.reconcileSchoolingRegistration)({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
      });

      // then
      expect(result).to.be.instanceof(CampaignCodeError);
    });
  });

  context('When no schoolingRegistration found', () => {

    it('should throw a Not Found error', async () => {
      // given
      campaignRepository.getByCode.withArgs(campaignCode).resolves({ organizationId });
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.throws(new NotFoundError('Error message'));

      // when
      const result = await catchErr(usecases.reconcileSchoolingRegistration)({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
        userReconciliationService,
      });

      // then
      expect(result).to.be.instanceof(NotFoundError);
      expect(result.message).to.equal('Error message');
    });
  });

  context('When student is already reconciled in others organizations', () => {

    it('should return a SchoolingRegistrationAlreadyLinkedToUser error', async () => {
      // given
      schoolingRegistration.userId = user.id;
      schoolingRegistration.firstName = user.firstName;
      schoolingRegistration.lastName = user.lastName;
      const exceptedErrorMEssage = 'Un compte existe déjà pour l\'élève dans un autre établissement.';
      campaignRepository.getByCode.withArgs(campaignCode).resolves({ organizationId });
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(schoolingRegistration);
      studentRepository.getReconciledStudentByNationalStudentId.resolves(new Student());
      userReconciliationService.checkIfStudentHasAlreadyAccountsReconciledInOtherOrganizations.throws(new SchoolingRegistrationAlreadyLinkedToUserError(exceptedErrorMEssage));

      // when
      const result = await catchErr(usecases.reconcileSchoolingRegistration)({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
        userReconciliationService,
        studentRepository,
      });

      // then
      expect(result).to.be.instanceof(SchoolingRegistrationAlreadyLinkedToUserError);
      expect(result.message).to.equal(exceptedErrorMEssage);
    });
  });

  context('When one schoolingRegistration matched on names', () => {

    it('should associate user with schoolingRegistration', async () => {
      // given
      schoolingRegistration.userId = user.id;
      schoolingRegistration.firstName = user.firstName;
      schoolingRegistration.lastName = user.lastName;
      campaignRepository.getByCode.withArgs(campaignCode).resolves({ organizationId });
      userReconciliationService.findMatchingSchoolingRegistrationIdForGivenOrganizationIdAndUser.resolves(schoolingRegistration);
      studentRepository.getReconciledStudentByNationalStudentId.resolves(new Student());
      userReconciliationService.checkIfStudentHasAlreadyAccountsReconciledInOtherOrganizations.resolves();
      schoolingRegistrationRepository.reconcileUserToSchoolingRegistration.withArgs({
        userId: user.id,
        schoolingRegistrationId,
      }).resolves(schoolingRegistration);

      // when
      const result = await usecases.reconcileSchoolingRegistration({
        reconciliationInfo: user,
        campaignCode,
        campaignRepository,
        userReconciliationService,
        studentRepository,
        schoolingRegistrationRepository,
      });

      // then
      expect(result).to.be.instanceOf(SchoolingRegistration);
      expect(result.userId).to.be.equal(user.id);
    });
  });
});