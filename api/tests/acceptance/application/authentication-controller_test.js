const { expect, databaseBuilder } = require('../../test-helper');
const querystring = require('querystring');

const createServer = require('../../../server');
const tokenService = require('../../../lib/domain/services/token-service');

describe('Acceptance | Controller | authentication-controller', () => {

  const orgaRoleInDB = { id: 1, name: 'ADMIN' };

  const userEmailAddress = 'user@example.net';
  const userPassword = 'A124B2C3#!';

  let server;
  let userId;

  beforeEach(async () => {
    server = await createServer();

    userId = databaseBuilder.factory.buildUser.withUnencryptedPassword({
      email: userEmailAddress,
      rawPassword: userPassword,
      cgu: true,
    }).id;

    await databaseBuilder.commit();
  });

  describe('POST /api/token', () => {

    let options;

    beforeEach(async () => {
      const organizationId = databaseBuilder.factory.buildOrganization().id;
      databaseBuilder.factory.buildMembership({ userId, organizationId, organizationRoleId: orgaRoleInDB.id });

      options = {
        method: 'POST',
        url: '/api/token',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        payload: querystring.stringify({
          grant_type: 'password',
          username: userEmailAddress,
          password: userPassword,
          scope: 'pix-orga',
        }),
      };

      await databaseBuilder.commit();
    });

    it('should return an 200 with accessToken when authentication is ok', async () => {
      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);

      const result = response.result;
      expect(result.token_type).to.equal('bearer');
      expect(result.access_token).to.exist;
      expect(result.user_id).to.equal(userId);
    });

    it('should return http code 401 when user should change password', async () => {
      // given
      const username = 'username123';
      const shouldChangePassword = true;

      databaseBuilder.factory.buildUser.withUnencryptedPassword({
        username,
        rawPassword: userPassword,
        cgu: true,
        shouldChangePassword,
      });

      const expectedResponseError = {
        errors: [
          {
            title: 'PasswordShouldChange',
            status: '401',
            detail: 'Erreur, vous devez changer votre mot de passe.',
          },
        ],
      };

      options.payload = querystring.stringify({
        grant_type: 'password',
        username,
        password: userPassword,
      });

      await databaseBuilder.commit();

      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(401);
      expect(response.result).to.deep.equal(expectedResponseError);
    });
  });

  describe('POST /api/token-from-external-user', () => {

    let options;

    beforeEach(async () => {
      const password = 'Pix123';
      const userAttributes = {
        firstName: 'saml',
        lastName: 'jackson',
        samlId: 'SAMLJACKSONID',
      };
      const user = databaseBuilder.factory.buildUser.withUnencryptedPassword({ username: 'saml.jackson1234', rawPassword: password });
      const expectedExternalToken = tokenService.createIdTokenForUserReconciliation(userAttributes);

      options = {
        method: 'POST',
        url: '/api/token-from-external-user',
        payload: {
          data: {
            attributes: {
              username: user.username,
              password: password,
              'external-user-token': expectedExternalToken,
              'expected-user-id': user.id,
            },
            type: 'external-user-authentication-requests',
          },
        },
      };

      await databaseBuilder.commit();
    });

    it('should return an 200 with accessToken when authentication is ok', async () => {
      // when
      const response = await server.inject(options);

      // then
      expect(response.statusCode).to.equal(200);
      expect(response.result.data.attributes['access-token']).to.exist;
    });

    context('When credentials are not valid', () => {

      it('should return a 401 Unauthorized', async () => {
        // given
        options.payload.data.attributes.username = 'unknown';

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
        expect(response.result.errors[0].detail).to.equal('L\'adresse e-mail et/ou le mot de passe saisis sont incorrects.');
      });
    });

    context('When user should change password', () => {

      it('should return a 401 Unauthorized', async () => {
        // given
        const password = 'password';
        const user = databaseBuilder.factory.buildUser.withUnencryptedPassword({ rawPassword: password, shouldChangePassword: true });
        await databaseBuilder.commit();

        options.payload.data.attributes.username = user.email;
        options.payload.data.attributes.password = password;

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(401);
        expect(response.result.errors[0].title).to.equal('PasswordShouldChange');
        expect(response.result.errors[0].detail).to.equal('Erreur, vous devez changer votre mot de passe.');
      });
    });

    context('When the authentified user does not match the expected one', () => {

      it('should return a 409 Conflict', async () => {
        // given
        const invalidUserId = databaseBuilder.factory.buildUser().id;
        await databaseBuilder.commit();
        options.payload.data.attributes['expected-user-id'] = invalidUserId;

        // when
        const response = await server.inject(options);

        // then
        expect(response.statusCode).to.equal(409);
        expect(response.result.errors[0].code).to.equal('UNEXPECTED_USER_ACCOUNT');
        expect(response.result.errors[0].detail).to.equal('Ce compte utilisateur n\'est pas celui qui est attendu.');
      });
    });
  });
});
