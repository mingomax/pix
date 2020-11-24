const Bookshelf = require('../bookshelf');
const BookshelfTargetProfilShare = require('../data/target-profile-share');

const bookshelfToDomainConverter = require('../utils/bookshelf-to-domain-converter');

module.exports = {
  addTargetProfilesToOrganization({ organizationId, targetProfileIdList }) {
    const targetProfileShareToAdd = targetProfileIdList.map((targetProfileId) => {
      return { organizationId, targetProfileId };
    });
    return Bookshelf.knex.batchInsert('target-profile-shares', targetProfileShareToAdd)
      .then(() => null);
  },

  async findByTargetProfileOfOrganization({ organizationId, targetProfileIdList }) {
    const targetProfilesShareBookshelf = await BookshelfTargetProfilShare
      .query((qb) => {
        qb.where('organizationId', organizationId);
        qb.whereIn('targetProfileId',  targetProfileIdList);
      })
      .fetchAll();

    return bookshelfToDomainConverter.buildDomainObjects(BookshelfTargetProfilShare, targetProfilesShareBookshelf);
  },
};
