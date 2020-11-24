const axios = require('axios');
const { lcms } = require('../config');

module.exports = {
  async getLatestRelease() {
    const response = await axios.get('/releases/latest', {
      baseURL: lcms.url,
      headers: { Authorization: `Basic ${lcms.apiKey}` },
    });
    return response.data;
  },
};
