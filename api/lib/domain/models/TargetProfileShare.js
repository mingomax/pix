class TargetProfileShare {
  constructor({
    id,
    organizationId,
    targetProfileId,
  } = {}) {
    this.id = id;
    this.organizationId = organizationId;
    this.targetProfileId = targetProfileId;
  }
}

module.exports = TargetProfileShare;
