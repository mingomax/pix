class ShareableCertificate {
  constructor({
    id,
    firstName,
    lastName,
    birthdate,
    birthplace,
    isPublished,
    userId,
    date,
    deliveredAt,
    certificationCenter,
    pixScore,
    status,
    cleaCertificationStatus,
    resultCompetenceTree = null,
  } = {}) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.birthdate = birthdate;
    this.birthplace = birthplace;
    this.isPublished = isPublished;
    this.userId = userId;
    this.date = date;
    this.deliveredAt = deliveredAt;
    this.certificationCenter = certificationCenter;
    this.pixScore = pixScore;
    this.status = status;
    this.cleaCertificationStatus = cleaCertificationStatus;
    this.resultCompetenceTree = resultCompetenceTree;
  }
}

module.exports = ShareableCertificate;
