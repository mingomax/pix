const studentUserAssociationController = require('./student-user-association-controller');
const Joi = require('@hapi/joi');
const JSONAPIError = require('jsonapi-serializer').Error;

exports.register = async function(server) {
  server.route([
    {
      method: 'POST',
      path: '/api/student-user-associations',
      config: {
        handler: studentUserAssociationController.associate,
        validate: {
          options: {
            allowUnknown: true
          },
          payload: Joi.object({
            data: {
              attributes: {
                'first-name': Joi.string().empty(Joi.string().regex(/^\s*$/)).required(),
                'last-name': Joi.string().empty(Joi.string().regex(/^\s*$/)).required(),
                'birthdate':Joi.date().iso().required(),
                'campaign-code': Joi.string().empty(Joi.string().regex(/^\s*$/)).required(),
              },
            },
          }),
          failAction: (request, h) => {
            const errorHttpStatusCode = 422;
            const jsonApiError = new JSONAPIError({
              status: errorHttpStatusCode.toString(),
              title: 'Unprocessable entity',
              detail: 'Un des champs saisis n’est pas valide.',
            });
            return h.response(jsonApiError).code(errorHttpStatusCode).takeover();
          }
        },
        notes: [
          '- **Cette route est restreinte aux utilisateurs authentifiés**\n' +
          '- Elle associe des données de l’utilisateur qui fait la requete, au student de l’organisation'
        ],
        tags: ['api', 'studentUserAssociation']
      }
    },
    {
      method: 'GET',
      path: '/api/student-user-associations',
      config: {
        handler: studentUserAssociationController.findAssociation,
        notes : [
          '- **Cette route est restreinte aux utilisateurs authentifiés**\n' +
          '- Récupération du student (au sein d’une organisation) lié au user\n' +
          '- L’id demandé doit correspondre à celui de l’utilisateur authentifié',
        ],
        tags: ['api', 'studentUserAssociation']
      }
    },
  ]);
};

exports.name = 'student-user-associations-api';
