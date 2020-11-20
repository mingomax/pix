const { FileValidationError, SameNationalStudentIdInFileError } = require('../errors');
const fs = require('fs');
const StreamZip = require('node-stream-zip');
const FileType = require('file-type');
const iconv = require('iconv-lite');
const moment = require('moment');
const xml2js = require('xml2js');
const sax = require('sax');
const saxPath = require('saxpath');
const xmlEncoding = require('xml-buffer-tostring').xmlEncoding;
const { isEmpty, isNil, each, isUndefined } = require('lodash');
const readline = require('readline');

const DEFAULT_FILE_ENCODING = 'iso-8859-15';
const DIVISION = 'D';
const NODE_ORGANIZATION_UAI = '/BEE_ELEVES/PARAMETRES';
const NODES_SCHOOLING_REGISTRATIONS = '/BEE_ELEVES/DONNEES/*/*';
const ELEVE_ELEMENT = '<ELEVE';
const STRUCTURE_ELEVE_ELEMENT = '<STRUCTURES_ELEVE';
const NO_STUDENTS_IMPORTED_FROM_INVALID_FILE = 'Aucun élève n’a pu être importé depuis ce fichier. Vérifiez que le fichier est conforme.';
const UAI_SIECLE_FILE_NOT_MATCH_ORGANIZATION_UAI = 'Aucun étudiant n’a été importé. L’import n’est pas possible car l’UAI du fichier SIECLE ne correspond pas à celui de votre établissement. En cas de difficulté, contactez support.pix.fr.';

const Stream = require('stream');

class StreamPipe extends Stream.Transform {

  constructor() {
    super();
  }

  _transform(chunk, enc, cb) {
    this.push(chunk);
    cb();
  }
}

function _unzippedStream(path) {
  const zip = new StreamZip({ file: path });
  const stream = new StreamPipe();

  zip.on('entry', (entry) => {
    zip.stream(entry, (err, stm) => {

      if (!entry.name.includes('/')) {
        stm.pipe(stream);
      }
    });
  });
  return stream;
}

const ZIP = 'zip';

class XMLStreamer {
  static async create(path) {
    const stream = new XMLStreamer(path)
    await stream._detectEncoding();

    return stream;
  }

  constructor(path) {
    this.path = path;
  }

  async _detectEncoding() {
    const firstLine = await this._readFirstLine();
    this.encoding = xmlEncoding(Buffer.from(firstLine)) || DEFAULT_FILE_ENCODING;
  }

  async getStream(){
    this.stream = await this._getRawStream();
    const saxParser = sax.createStream(true);
    return this.stream.pipe(iconv.decodeStream(this.encoding)).pipe(saxParser);
  }

  async _getRawStream(){
    let stream;
    if (await this._isFileZipped()) {
      stream = _unzippedStream(this.path);
    }
    else {
      stream = fs.createReadStream(this.path);
    }
    return stream;
  }

  async _isFileZipped() {
    const { ext } = await FileType.fromFile(this.path);
    return ext === ZIP
  }

  async _readFirstLine() {
    const stream = await this._getRawStream();
    const firstLineReader = readline.createInterface({ input: stream });

    return await new Promise((resolve) => {
      firstLineReader.on('line', (line) => {
        firstLineReader.close();
        resolve(line);
      })
    });
  }

  destroyStream() {
    this.stream.destroy();
  }
}

let XMLstreamer;

module.exports = {
  extractSchoolingRegistrationsInformationFromSIECLE,
};

async function extractSchoolingRegistrationsInformationFromSIECLE(path, organization) {
  XMLstreamer = await XMLStreamer.create(path)

  const UAIFromSIECLE = await _extractUAI(path);
  const UAIFromUserOrganization = organization.externalId;

  if (UAIFromSIECLE !== UAIFromUserOrganization) {
    throw new FileValidationError(UAI_SIECLE_FILE_NOT_MATCH_ORGANIZATION_UAI);
  }

  const schoolingRegistrations = await _processSiecleFile(path);

  return schoolingRegistrations.filter((schoolingRegistration) => !isUndefined(schoolingRegistration.division));
}

function _extractUAI() {
  return _withSiecleStream( _extractUAIFromStream);
}

async function _processSiecleFile() {
  return _withSiecleStream(_extractStudentRegistrationsFromStream);
}

async function _withSiecleStream(fn) {
  const siecleFileStream = await XMLstreamer.getStream();

  try {
    return await fn(siecleFileStream);
  } finally {
    XMLstreamer.destroyStream();
  }
}

function _extractUAIFromStream(saxParser) {
  return new Promise(function(resolve, reject) {
    saxParser.on('error', () => {
      reject(new FileValidationError('XML invalide'));
    });

    const streamerToParseOrganizationUAI = new saxPath.SaXPath(saxParser, NODE_ORGANIZATION_UAI);

    streamerToParseOrganizationUAI.once('match', (xmlNode) => {
      xml2js.parseString(xmlNode, (err, nodeData) => {
        if (err) return reject(err);
        if (nodeData.PARAMETRES) {
          const UAIFromSIECLE = _getValueFromParsedElement(nodeData.PARAMETRES.UAJ);
          resolve(UAIFromSIECLE);
        }
      });
    });

    saxParser.on('end', () => {
      reject(new FileValidationError(UAI_SIECLE_FILE_NOT_MATCH_ORGANIZATION_UAI));
    });

  });
}

function _extractStudentRegistrationsFromStream(saxParser) {
  return new Promise(function(resolve, reject_) {
    saxParser.on('error', () => {
      reject(new FileValidationError(NO_STUDENTS_IMPORTED_FROM_INVALID_FILE));
    });

    const reject = (e) => {
      saxParser.removeAllListeners();
      return reject_(e);
    };

    const mapSchoolingRegistrationsByStudentId = new Map();
    const nationalStudentIds = [];

    const streamerToParseSchoolingRegistrations = new saxPath.SaXPath(saxParser, NODES_SCHOOLING_REGISTRATIONS);
    streamerToParseSchoolingRegistrations.on('match', (xmlNode) => {
      if (_isSchoolingRegistrationNode(xmlNode)) {
        xml2js.parseString(xmlNode, (err, nodeData) => {
          try {
            if (err) throw err;
            processStudentsNodes(mapSchoolingRegistrationsByStudentId, nodeData, nationalStudentIds);
            processStudentsStructureNodes(mapSchoolingRegistrationsByStudentId, nodeData);
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

function _mapStudentInformationToSchoolingRegistration(nodeData) {
  return {
    lastName: _getValueFromParsedElement(nodeData.ELEVE.NOM_DE_FAMILLE),
    preferredLastName: _getValueFromParsedElement(nodeData.ELEVE.NOM_USAGE),
    firstName: _getValueFromParsedElement(nodeData.ELEVE.PRENOM),
    middleName: _getValueFromParsedElement(nodeData.ELEVE.PRENOM2),
    thirdName: _getValueFromParsedElement(nodeData.ELEVE.PRENOM3),
    birthdate: moment(nodeData.ELEVE.DATE_NAISS, 'DD/MM/YYYY').format('YYYY-MM-DD') || null,
    birthCountryCode: _getValueFromParsedElement(nodeData.ELEVE.CODE_PAYS, null),
    birthProvinceCode: _getValueFromParsedElement(nodeData.ELEVE.CODE_DEPARTEMENT_NAISS),
    birthCityCode: _getValueFromParsedElement(nodeData.ELEVE.CODE_COMMUNE_INSEE_NAISS),
    birthCity: _getValueFromParsedElement(nodeData.ELEVE.VILLE_NAISS),
    MEFCode: _getValueFromParsedElement(nodeData.ELEVE.CODE_MEF),
    status: _getValueFromParsedElement(nodeData.ELEVE.CODE_STATUT),
    nationalStudentId: _getValueFromParsedElement(nodeData.ELEVE.ID_NATIONAL),
  };
}

function _isSchoolingRegistrationNode(xmlNode) {
  return xmlNode.startsWith(ELEVE_ELEMENT) || xmlNode.startsWith(STRUCTURE_ELEVE_ELEMENT);
}

function _isStudentEligible(studentData, mapSchoolingRegistrationsByStudentId) {
  const isStudentNotLeftSchoolingRegistration = isEmpty(studentData.DATE_SORTIE);
  const isStudentNotYetArrivedSchoolingRegistration = !isEmpty(studentData.ID_NATIONAL);
  const isStudentNotDuplicatedInTheSIECLEFile = !mapSchoolingRegistrationsByStudentId.has(studentData.$.ELEVE_ID);
  return isStudentNotLeftSchoolingRegistration && isStudentNotYetArrivedSchoolingRegistration && isStudentNotDuplicatedInTheSIECLEFile;
}

function _getValueFromParsedElement(obj) {
  if (isNil(obj)) return null;
  return (Array.isArray(obj) && !isEmpty(obj)) ? obj[0] : obj;
}

function processStudentsNodes(mapSchoolingRegistrationsByStudentId, nodeData, nationalStudentIds) {
  const studentData = nodeData.ELEVE;
  if (studentData && _isStudentEligible(studentData, mapSchoolingRegistrationsByStudentId)) {
    const nationalStudentId = _getValueFromParsedElement(nodeData.ELEVE.ID_NATIONAL);
    _throwIfNationalStudentIdIsDuplicatedInFile(nationalStudentId, nationalStudentIds);
    nationalStudentIds.push(nationalStudentId);
    mapSchoolingRegistrationsByStudentId.set(nodeData.ELEVE.$.ELEVE_ID, _mapStudentInformationToSchoolingRegistration(nodeData));
  }
}

function processStudentsStructureNodes(mapSchoolingRegistrationsByStudentId, nodeData) {
  if (nodeData.STRUCTURES_ELEVE && mapSchoolingRegistrationsByStudentId.has(nodeData.STRUCTURES_ELEVE.$.ELEVE_ID)) {
    const currentStudent = mapSchoolingRegistrationsByStudentId.get(nodeData.STRUCTURES_ELEVE.$.ELEVE_ID);
    const structureElement = nodeData.STRUCTURES_ELEVE.STRUCTURE;

    each(structureElement, (structure) => {
      if (structure.TYPE_STRUCTURE[0] === DIVISION && structure.CODE_STRUCTURE[0] !== 'Inactifs') {
        currentStudent.division = structure.CODE_STRUCTURE[0];
      }
    });
  }
}

function _throwIfNationalStudentIdIsDuplicatedInFile(nationalStudentId, nationalStudentIds) {
  if (nationalStudentId && nationalStudentIds.indexOf(nationalStudentId) !== -1) {
    throw new SameNationalStudentIdInFileError(nationalStudentId);
  }
}
