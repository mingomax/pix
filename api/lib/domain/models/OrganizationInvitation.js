const statuses = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
};

class OrganizationInvitation {

  constructor({
    id,
    // attributes
    organizationId,
    email,
    status,
    code,
    createdAt,
    updatedAt,
  } = {}) {
    this.id = id;
    // attributes
    this.organizationId = organizationId;
    this.email = email;
    this.status = status;
    this.code = code;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  get isPending() {
    return this.status === statuses.PENDING;
  }

  get isAccepted() {
    return this.status === statuses.ACCEPTED;
  }
}

OrganizationInvitation.StatusType = statuses;

module.exports = OrganizationInvitation;