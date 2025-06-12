const axios = require("axios");
require("dotenv").config();

const BASE_URL = process.env.BASE_URL;
const CANDIDATE_ID = process.env.CANDIDATE_ID;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" }
});

// Get the full goal map
async function fetchGoalMap() {
  try {
    const res = await api.get(`/map/${CANDIDATE_ID}/goal`);
    return res.data.goal;
  } catch (err) {
    console.error("❌ Error fetching goal map:", err.message);
    return [];
  }
}

// POST any type of entity
async function postEntity(type, row, column, extra = {}) {
  try {
    await api.post(`/${type}`, {
      row,
      column,
      candidateId: CANDIDATE_ID,
      ...extra
    });
    console.log(`✅ Created ${type} at (${row}, ${column})`, extra);
    return true;
  } catch (err) {
    console.error(`❌ Failed to create ${type} at (${row}, ${column})`, err.response?.data || err.message);
    return false;
  }
}


// Parse string to determine entity type and any extra args
function parseCell(cellValue) {
  if (!cellValue || cellValue === "SPACE") return null;

  if (cellValue === "POLYANET") {
    return { type: "polyanets" };
  }

  if (cellValue.endsWith("_SOLOON")) {
    const color = cellValue.split("_")[0].toLowerCase();
    return { type: "soloons", extra: { color } };
  }

  if (cellValue.endsWith("_COMETH")) {
    const direction = cellValue.split("_")[0].toLowerCase();
    return { type: "comeths", extra: { direction } };
  }

  return null;
}

// Loop through the grid and POST all valid astral objects
async function buildFromGoalMap() {
  const map = await fetchGoalMap();

  const isPolyanetAt = (r, c) =>
    r >= 0 &&
    r < map.length &&
    c >= 0 &&
    c < map[0].length &&
    map[r][c] === "POLYANET";

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const cell = map[row][col];
      const parsed = parseCell(cell);
      if (!parsed) continue;

      const { type, extra = {} } = parsed;

      // For SOLOON, validate adjacent POLYANET
      if (
        type === "soloons" &&
        !(
          isPolyanetAt(row - 1, col) ||
          isPolyanetAt(row + 1, col) ||
          isPolyanetAt(row, col - 1) ||
          isPolyanetAt(row, col + 1)
        )
      ) {
        console.warn(`⏭️ Skipping SOLOON at (${row}, ${col}) — no adjacent POLYANET`);
        continue;
      }

      let attempts = 0;
      let success = false;

      while (!success && attempts < 5) {
        success = await postEntity(type, row, col, extra);
        if (!success) {
          console.log(`🔁 Retrying in 1s...`);
          await new Promise((r) => setTimeout(r, 1000));
        }
        attempts++;
      }

      await new Promise((r) => setTimeout(r, 500));
    }
  }
}


module.exports = {
  buildFromGoalMap
};
