const axios = require("axios");
require("dotenv").config();

class CrossmintClient {
  constructor(candidateId, baseUrl) {
    this.candidateId = candidateId;
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }

  async createEntity(entity) {
    try {
      const endpoint = entity.apiEndpoint;
      const payload = entity.getPayload(this.candidateId);
      console.log(`POST ${endpoint} at (${entity.row}, ${entity.column})`);
      const response = await this.api.post(endpoint, payload);
      return response.data;
    } catch (error) {
      console.error(
        `Error creating entity at (${entity.row}, ${entity.column}):`,
        error.response ? error.response.data : error.message
      );
      // Re-throw the error so the caller can handle retries
      throw error;
    }
  }

  async getGoalMap() {
    try {
      const response = await this.api.get(`/map/${this.candidateId}/goal`);
      return response.data.goal;
    } catch (error) {
      console.error(
        "Error fetching goal map:",
        error.response ? error.response.data : error.message
      );
      throw error;
    }
  }
}

module.exports = CrossmintClient;
