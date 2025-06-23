import "dotenv/config";
import { CrossmintClient } from "./api/client";
import { createXPattern } from "./services/megaverseBuilder";
import { Phase2Builder } from "./services/phase2builder";

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
    const err = error as Error;
    console.error("💥 An unexpected error occurred:", err.message);
  }
}

main();
