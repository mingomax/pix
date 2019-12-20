const _ = require('lodash');
const airtable = require('../../airtable');
const AirtableResourceNotFound = require('./AirtableResourceNotFound');

const _DatasourcePrototype = {

  get(id) {
    return airtable.getRecord(this.tableName, id).then(this.fromAirTableObject).catch((err) => {
      if (err.error === 'NOT_FOUND') {
        throw new AirtableResourceNotFound();
      }
      throw err;
    });
  },

  list() {
    return airtable.findRecords(this.tableName, this.usedFields)
      .then((airtableRawObjects) => {
        return airtableRawObjects.map(this.fromAirTableObject);
      });
  },

  preload() {
    return airtable.preload(this.tableName, this.usedFields);
  },

};

module.exports = {

  extend(props) {
    const result = Object.assign({}, _DatasourcePrototype, props);
    _.bindAll(result, _.functions(result));
    return result;
  },

};