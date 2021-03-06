const Joi = require('@hapi/joi').extend(require('@hapi/joi-date'));
const { validateEntity } = require('../validators/entity-validator');

const identityProviders = {
  PIX : 'PIX',
  GAR: 'GAR',
  POLE_EMPLOI: 'POLE_EMPLOI',
};

class PasswordAuthenticationMethod {

  constructor({
    password,
    shouldChangePassword,
  } = {}) {
    this.password = password;
    this.shouldChangePassword = shouldChangePassword;

    validateEntity(Joi.object({
      password: Joi.string().required(),
      shouldChangePassword: Joi.boolean().required(),
    }), this);
  }
}

const validationSchema = Joi.object({
  id: Joi.number().optional(),
  identityProvider: Joi.string().valid(...Object.values(identityProviders)).required(),
  authenticationComplement: Joi.when('identityProvider', { is: identityProviders.PIX, then: Joi.object().instance(PasswordAuthenticationMethod).required(), otherwise: Joi.any().forbidden() }),
  externalIdentifier: Joi.when('identityProvider', [
    { is: identityProviders.GAR, then: Joi.string().required() },
    { is: identityProviders.POLE_EMPLOI, then: Joi.string().required() },
    { is: identityProviders.PIX, then: Joi.any().forbidden() },
  ]),
  userId: Joi.number().integer().required(),
  createdAt: Joi.date().optional(),
  updatedAt: Joi.date().optional(),
});

class AuthenticationMethod {

  constructor({
    id,
    // attributes
    identityProvider,
    authenticationComplement,
    externalIdentifier,
    createdAt,
    updatedAt,
    // includes
    // references
    userId,
  } = {}) {
    this.id = id;
    // attributes
    this.identityProvider = identityProvider;
    this.authenticationComplement = authenticationComplement;
    this.externalIdentifier = externalIdentifier;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    // includes
    // references
    this.userId = userId;

    validateEntity(validationSchema, this);
  }
}

AuthenticationMethod.identityProviders = identityProviders;
AuthenticationMethod.PasswordAuthenticationMethod = PasswordAuthenticationMethod;
module.exports = AuthenticationMethod;
