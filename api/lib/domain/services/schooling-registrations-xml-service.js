const XMLStreamer = require('../../infrastructure/utils/xml/xml-streamer');
const SiecleParser = require('../../infrastructure/serializers/xml/siecle-parser');

module.exports = {
  extractSchoolingRegistrationsInformationFromSIECLE,
};

async function extractSchoolingRegistrationsInformationFromSIECLE(path, organization) {
  const xmlStreamer = await XMLStreamer.create(path)
  parser = new SiecleParser(organization, xmlStreamer);

  return parser.parse();
}
