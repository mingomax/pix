const _ = require('lodash');
const airtable = require('../../airtable');
const lcms = require('../../lcms');
const LearningContentResourceNotFound = require('./LearningContentResourceNotFound');
const cache = require('../../caches/learning-content-cache');

const learningContentCacheKey = 'LearningContent';

const _DatasourcePrototype = {

  async _doList() {
    const learningContent = await lcms.getLatestRelease();
    return learningContent;
  },

  async get(id) {
    const modelObjects = await this.list();
    const foundObject = _.find(modelObjects, { id });

    if (!foundObject) {
      throw new LearningContentResourceNotFound();
    }

    return foundObject;
  },

  async list() {
    const generator = () => this._doList();
    const learningContent = await cache.get(learningContentCacheKey, generator);
    return learningContent[this.modelName];
  },

  async refreshLearningContentCacheRecord(newEntry) {
    const currentLearningContent = await this.list();
    const currentRecords = currentLearningContent[this.modelName];
    const updatedRecords = _.reject(currentRecords, { id: newEntry.id }).concat([newEntry]);
    const newLearningContent = Object.assign({}, currentLearningContent);
    newLearningContent[this.modelName] = updatedRecords;
    await cache.set(learningContentCacheKey, newLearningContent);
    return newEntry;
  },

};

module.exports = {

  extend(props) {
    const result = Object.assign({}, _DatasourcePrototype, props);
    _.bindAll(result, _.functions(result));
    return result;
  },

  async refreshLearningContentCacheRecords() {
    const learningContent = await lcms.getLatestRelease();
    await cache.set(learningContentCacheKey, learningContent);
    return learningContent;
  },

};
