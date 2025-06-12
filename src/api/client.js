const axios = require("axios");
require("dotenv").config();

const api = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

async function createPolyanet(row, column) {
  try {
    const response = await api.post("/polyanets", {
      row,
      column,
      candidateId: process.env.CANDIDATE_ID
    });
    console.log(`Polyanet created at (${row}, ${column})`);
    return response.data;
  } catch (error) {
    console.error(`Error creating Polyanet at (${row}, ${column}):`, error.message);
  }
}

module.exports = {
  createPolyanet
};
