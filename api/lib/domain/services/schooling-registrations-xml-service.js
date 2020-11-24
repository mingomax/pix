const { FileValidationError } = require('../errors');
const xml2js = require('xml2js');
const saxPath = require('saxpath');
const { isEmpty, isUndefined } = require('lodash');

const NODE_ORGANIZATION_UAI = '/BEE_ELEVES/PARAMETRES';
const NODES_SCHOOLING_REGISTRATIONS = '/BEE_ELEVES/DONNEES/*/*';
const ELEVE_ELEMENT = '<ELEVE';
const STRUCTURE_ELEVE_ELEMENT = '<STRUCTURES_ELEVE';
const NO_STUDENTS_IMPORTED_FROM_INVALID_FILE = 'Aucun élève n’a pu être importé depuis ce fichier. Vérifiez que le fichier est conforme.';
const UAI_SIECLE_FILE_NOT_MATCH_ORGANIZATION_UAI = 'Aucun étudiant n’a été importé. L’import n’est pas possible car l’UAI du fichier SIECLE ne correspond pas à celui de votre établissement. En cas de difficulté, contactez support.pix.fr.';

const XMLStreamer = require('../../infrastructure/utils/xml/xml-streamer');
const XMLSchoolingRegistrationSet = require('../../infrastructure/serializers/xml/xml-schooling-registration-set');

let XmlStreamer;

class SiecleParser {
  constructor(organization) {
    this.organization = organization;
  }

  async parse() {

    await this._checkUAI();

    const schoolingRegistrations = await this._parseStudent();

    return schoolingRegistrations.filter((schoolingRegistration) => !isUndefined(schoolingRegistration.division));
  }

  async _checkUAI() {
    const UAIFromSIECLE = await XmlStreamer.perform(_extractUAI);
    const UAIFromUserOrganization = this.organization.externalId;

    if (UAIFromSIECLE !== UAIFromUserOrganization) {
      throw new FileValidationError(UAI_SIECLE_FILE_NOT_MATCH_ORGANIZATION_UAI);
    }
  }

  async _parseStudent() {
    return await XmlStreamer.perform(_extractStudentRegistrationsFromStream);
  }
}

module.exports = {
  extractSchoolingRegistrationsInformationFromSIECLE,
};

async function extractSchoolingRegistrationsInformationFromSIECLE(path, organization) {
  XmlStreamer = await XMLStreamer.create(path)
  parser = new SiecleParser(organization)

  return parser.parse();
}

function _extractUAI(saxParser) {
  return new Promise(function(resolve, reject) {
    saxParser
      .on('error', () => reject(new FileValidationError('XML invalide')))
      .on('end', () => resolve(null));

    const streamerToParseOrganizationUAI = new saxPath.SaXPath(saxParser, NODE_ORGANIZATION_UAI);

    streamerToParseOrganizationUAI.once('match', (xmlNode) => {
      xml2js.parseString(xmlNode, (err, nodeData) => {
        if (err) return reject(err);
        if (nodeData.PARAMETRES) {
            resolve(nodeData.PARAMETRES.UAJ[0]);// Si je garde que cette ligne tous les tests passent
          }
      });
    });
  });
}

function _extractStudentRegistrationsFromStream(saxParser) {
  return new Promise(function(resolve, reject_) {
    saxParser.on('error', () => {
      reject(new FileValidationError(NO_STUDENTS_IMPORTED_FROM_INVALID_FILE));
    });

    const reject = (e) => {
      saxParser.removeAllListeners();//si j'enlève cette ligne les tests passent
      return reject_(e);
    };

    const schoolingRegistrationsSet = new XMLSchoolingRegistrationSet();
    const mapSchoolingRegistrationsByStudentId = schoolingRegistrationsSet.schoolingRegistrationsByStudentId;

    const streamerToParseSchoolingRegistrations = new saxPath.SaXPath(saxParser, NODES_SCHOOLING_REGISTRATIONS);
    streamerToParseSchoolingRegistrations.on('match', (xmlNode) => {
      if (_isSchoolingRegistrationNode(xmlNode)) {
        xml2js.parseString(xmlNode, (err, nodeData) => {
          try {
            if (err) throw err;// Si j'enleve cette ligne les tests passent

            if(nodeData.ELEVE && _isImportable(nodeData.ELEVE, mapSchoolingRegistrationsByStudentId)) {
              schoolingRegistrationsSet.add(nodeData.ELEVE.$.ELEVE_ID, nodeData.ELEVE);            }
            else if (nodeData.STRUCTURES_ELEVE && mapSchoolingRegistrationsByStudentId.has(nodeData.STRUCTURES_ELEVE.$.ELEVE_ID)) {
              schoolingRegistrationsSet.updateDivision(nodeData);
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    });


    streamerToParseSchoolingRegistrations.on('end', () => {
      resolve(Array.from(mapSchoolingRegistrationsByStudentId.values()));
    });
  });
}

function _isSchoolingRegistrationNode(xmlNode) {
  return xmlNode.startsWith(ELEVE_ELEMENT) || xmlNode.startsWith(STRUCTURE_ELEVE_ELEMENT);
}

function _isImportable(studentData, mapSchoolingRegistrationsByStudentId) {
  const isStudentNotLeftSchoolingRegistration = isEmpty(studentData.DATE_SORTIE);
  const isStudentNotYetArrivedSchoolingRegistration = !isEmpty(studentData.ID_NATIONAL);
  const isStudentNotDuplicatedInTheSIECLEFile = !mapSchoolingRegistrationsByStudentId.has(studentData.$.ELEVE_ID);// Si je fais isStudentNotDuplicatedInTheSIECLEFile = true les tests passent
  return isStudentNotLeftSchoolingRegistration && isStudentNotYetArrivedSchoolingRegistration && isStudentNotDuplicatedInTheSIECLEFile;
}
