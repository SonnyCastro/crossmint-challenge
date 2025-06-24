import "dotenv/config";
import { CrossmintClient } from "./api/client";
import { createXPattern } from "./services/megaverseBuilder";
import { Phase2Builder } from "./services/phase2builder";
import { ErrorHandler } from "./utils/ErrorHandler";

async function validateEnvironment(): Promise<{ candidateId: string; baseUrl: string }> {
  const candidateId = process.env.CANDIDATE_ID;
  const baseUrl = process.env.BASE_URL;

  if (!candidateId) {
    throw new Error("CANDIDATE_ID environment variable is required");
  }

  if (!baseUrl) {
    throw new Error("BASE_URL environment variable is required");
  }

  // Validate URL format
  try {
    new URL(baseUrl);
  } catch {
    throw new Error("BASE_URL must be a valid URL");
  }

  return { candidateId, baseUrl };
}

async function runPhase1(client: CrossmintClient): Promise<void> {
  console.log("🪐 Starting Phase 1: Creating X pattern...");

  try {
    await createXPattern(client, 2, 2, 7);
    console.log("✅ Phase 1 completed successfully!");
  } catch (error) {
    console.error("❌ Phase 1 failed:");
    ErrorHandler.logError(error as Error, "Phase 1");
    throw error;
  }
}

async function runPhase2(client: CrossmintClient): Promise<void> {
  console.log("🚀 Starting Phase 2: Building from goal map...");

  try {
    const phase2Builder = new Phase2Builder(client);
    await phase2Builder.buildFromGoalMap();
    console.log("✅ Phase 2 completed successfully!");
  } catch (error) {
    console.error("❌ Phase 2 failed:");
    ErrorHandler.logError(error as Error, "Phase 2");
    throw error;
  }
}

async function main(): Promise<void> {
  console.log("🎯 Megaverse Challenge - Starting execution...");
  console.log("=".repeat(50));

  try {
    // Validate environment
    const { candidateId, baseUrl } = await validateEnvironment();
    console.log(`🔧 Environment validated - Candidate ID: ${candidateId}`);

    // Create client with rate-limit aware retry configuration
    const client = new CrossmintClient(candidateId, baseUrl, {
      maxRetries: 8,
      baseDelay: 2000,
      maxDelay: 60000,
      backoffMultiplier: 2.5
    });

    // Execute phases
    await runPhase1(client);
    await runPhase2(client);

    console.log("=".repeat(50));
    console.log("🎉 All phases completed successfully!");
    console.log("🏆 Megaverse challenge completed!");

  } catch (error) {
    console.error("=".repeat(50));
    console.error("💥 Execution failed:");

    const errorInfo = ErrorHandler.classifyError(error as Error);
    console.error(`Error Type: ${errorInfo.type}`);
    console.error(`Message: ${errorInfo.message}`);

    if (errorInfo.recoveryStrategy) {
      console.error(`Recovery Strategy: ${errorInfo.recoveryStrategy}`);
    }

    // Exit with error code
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

main();
