require("dotenv").config();

const CrossmintClient = require("./api/client");
const { createXPattern } = require("./services/megaverseBuilder");
const Phase2Builder = require("./services/phase2builder");

async function main() {
  const candidateId = process.env.CANDIDATE_ID;
  const baseUrl = process.env.BASE_URL;

  if (!candidateId || !baseUrl) {
    throw new Error("CANDIDATE_ID and BASE_URL must be set in .env file");
  }

  const client = new CrossmintClient(candidateId, baseUrl);

  try {
    // Phase 1
    console.log("🪐 Starting Phase 1: Creating X pattern...");
    await createXPattern(client, 2, 2, 7);
    console.log("✅ Phase 1 completed!");

    // Phase 2
    const phase2Builder = new Phase2Builder(client);
    await phase2Builder.buildFromGoalMap();

  } catch (error) {
    console.error("💥 An unexpected error occurred:", error.message);
  }
}

main();
