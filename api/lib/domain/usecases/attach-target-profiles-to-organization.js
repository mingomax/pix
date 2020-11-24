const _ = require('lodash');
const { NotFoundError } = require('../errors');

module.exports = async function attachTargetProfilesToOrganization({
  organizationId,
  targetProfileIdsToAttach,
  targetProfileRepository,
  targetProfileShareRepository,
}) {
  const uniqueTargetProfileIdsToAttach = _.uniq(targetProfileIdsToAttach);

  const foundTargetProfiles = await targetProfileRepository.findByIds(uniqueTargetProfileIdsToAttach);

  if (foundTargetProfiles.length !== uniqueTargetProfileIdsToAttach.length) {
    const foundTargetProfileIds = _.map(foundTargetProfiles, 'id');
    const [targetProfileIdNotExisting] = _.difference(uniqueTargetProfileIdsToAttach, foundTargetProfileIds);
    throw new NotFoundError(`Le profil cible ${targetProfileIdNotExisting} n'existe pas.`);
  }

  const targetProfileShareToAttach = await _getTargetProfileToAttach({ organizationId, targetProfileShareRepository, targetProfileIdList: uniqueTargetProfileIdsToAttach });

  return targetProfileShareRepository.addTargetProfilesToOrganization({ organizationId, targetProfileIdList: targetProfileShareToAttach });
};

async function _getTargetProfileToAttach({ organizationId, targetProfileIdList, targetProfileShareRepository }) {
  const targetProfileSharesByOrganizationId = await targetProfileShareRepository.findByTargetProfileOfOrganization({ organizationId, targetProfileIdList });

  const foundTargetProfileShareIds = _.map(targetProfileSharesByOrganizationId, 'targetProfileId');
  
  const targetProfileShareToAttach = _.difference(targetProfileIdList, foundTargetProfileShareIds);

  if (targetProfileShareToAttach.length === 0) {
    throw new NotFoundError('Profil(s) cible(s) déjà rattaché.');
  }

  return targetProfileShareToAttach;
}
