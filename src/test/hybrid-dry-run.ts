import "dotenv/config";
import { CrossmintClient } from "../api/client";
import { createXPattern } from "../services/megaverseBuilder";
import { Phase2Builder } from "../services/phase2builder";
import { AxiosError } from "axios";

// Hybrid client that uses real API for goal map but mocks entity creation
class HybridCrossmintClient extends CrossmintClient {
  private requestCount = 0;
  private shouldFail = false;
  private failureType: 'rate_limit' | 'server_error' | 'network_error' | 'validation_error' = 'rate_limit';
  private successAfterAttempts = 3;
  private mockMode = false;

  constructor(candidateId: string, baseUrl: string) {
    super(candidateId, baseUrl);
  }

  // Enable mock mode for entity creation
  enableMockMode(
    shouldFail: boolean,
    failureType: 'rate_limit' | 'server_error' | 'network_error' | 'validation_error' = 'rate_limit',
    successAfterAttempts: number = 3
  ) {
    this.mockMode = true;
    this.shouldFail = shouldFail;
    this.failureType = failureType;
    this.successAfterAttempts = successAfterAttempts;
    this.requestCount = 0;
  }

  // Disable mock mode (use real API)
  disableMockMode() {
    this.mockMode = false;
  }

  private createMockError(): AxiosError {
    const error = new Error('Mock entity creation error') as AxiosError;
    error.isAxiosError = true;
    error.name = 'AxiosError';

    switch (this.failureType) {
      case 'rate_limit':
        error.response = { status: 429, data: 'Rate limit exceeded' } as any;
        break;
      case 'server_error':
        error.response = { status: 500, data: 'Internal server error' } as any;
        break;
      case 'network_error':
        error.response = undefined;
        break;
      case 'validation_error':
        error.response = { status: 400, data: 'Bad request' } as any;
        break;
    }

    return error;
  }

  // Override only createEntity to use mock behavior
  async createEntity(entity: any): Promise<void> {
    if (!this.mockMode) {
      // Use real API
      return super.createEntity(entity);
    }

    // Use the retry mechanism from the parent class
    const retryManager = (this as any).retryManager;

    await retryManager.execute(
      async () => {
        this.requestCount++;
        console.log(`🔧 MOCK: Creating ${entity.constructor.name} at (${entity.row}, ${entity.column}) - Attempt ${this.requestCount}`);

        if (this.shouldFail && this.requestCount < this.successAfterAttempts) {
          const error = this.createMockError();
          console.log(`❌ MOCK: Simulating ${this.failureType} error (Status: ${error.response?.status})`);
          throw error;
        }

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 100));
        console.log(`✅ MOCK: Successfully created ${entity.constructor.name} at (${entity.row}, ${entity.column})`);
        return { data: 'success' };
      },
      `Creating ${entity.constructor.name}`,
      `(${entity.row}, ${entity.column})`
    );
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}

// Test scenarios using the real main script logic
async function testSuccessfulScenario() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING SUCCESSFUL SCENARIO (Real API + Mock Entities)");
  console.log("=".repeat(60));

  const candidateId = process.env.CANDIDATE_ID;
  const baseUrl = process.env.BASE_URL;

  if (!candidateId || !baseUrl) {
    console.error("❌ CANDIDATE_ID and BASE_URL must be set in .env file");
    return;
  }

  const client = new HybridCrossmintClient(candidateId, baseUrl);

  try {
    // Test Phase 1 with mock entity creation
    console.log("🪐 Testing Phase 1: Creating X pattern...");
    client.enableMockMode(false); // No failures
    await createXPattern(client, 2, 2, 7);
    console.log("✅ Phase 1 completed successfully!");

    // Test Phase 2 with real goal map but mock entity creation
    console.log("🚀 Testing Phase 2: Building from goal map...");
    client.enableMockMode(false); // No failures
    const phase2Builder = new Phase2Builder(client);
    await phase2Builder.buildFromGoalMap();
    console.log("✅ Phase 2 completed successfully!");

  } catch (error) {
    console.error("💥 Test failed:", (error as Error).message);
  }
}

async function testRateLimitScenario() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING RATE LIMIT SCENARIO (Real API + Mock Rate Limits)");
  console.log("=".repeat(60));

  const candidateId = process.env.CANDIDATE_ID;
  const baseUrl = process.env.BASE_URL;

  if (!candidateId || !baseUrl) {
    console.error("❌ CANDIDATE_ID and BASE_URL must be set in .env file");
    return;
  }

  const client = new HybridCrossmintClient(candidateId, baseUrl);

  try {
    // Test Phase 1 with rate limit failures
    console.log("🪐 Testing Phase 1: Creating X pattern with rate limits...");
    client.enableMockMode(true, 'rate_limit', 4); // Fail 3 times, succeed on 4th
    await createXPattern(client, 2, 2, 3); // Smaller pattern for testing
    console.log("✅ Phase 1 completed successfully!");

    // Test Phase 2 with rate limit failures
    console.log("🚀 Testing Phase 2: Building from goal map with rate limits...");
    client.enableMockMode(true, 'rate_limit', 3); // Fail 2 times, succeed on 3rd
    const phase2Builder = new Phase2Builder(client);
    await phase2Builder.buildFromGoalMap();
    console.log("✅ Phase 2 completed successfully!");

  } catch (error) {
    console.error("💥 Test failed:", (error as Error).message);
  }
}

async function testServerErrorScenario() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING SERVER ERROR SCENARIO (Real API + Mock Server Errors)");
  console.log("=".repeat(60));

  const candidateId = process.env.CANDIDATE_ID;
  const baseUrl = process.env.BASE_URL;

  if (!candidateId || !baseUrl) {
    console.error("❌ CANDIDATE_ID and BASE_URL must be set in .env file");
    return;
  }

  const client = new HybridCrossmintClient(candidateId, baseUrl);

  try {
    // Test Phase 1 with server errors
    console.log("🪐 Testing Phase 1: Creating X pattern with server errors...");
    client.enableMockMode(true, 'server_error', 3); // Fail 2 times, succeed on 3rd
    await createXPattern(client, 2, 2, 3); // Smaller pattern for testing
    console.log("✅ Phase 1 completed successfully!");

    // Test Phase 2 with server errors
    console.log("🚀 Testing Phase 2: Building from goal map with server errors...");
    client.enableMockMode(true, 'server_error', 2); // Fail 1 time, succeed on 2nd
    const phase2Builder = new Phase2Builder(client);
    await phase2Builder.buildFromGoalMap();
    console.log("✅ Phase 2 completed successfully!");

  } catch (error) {
    console.error("💥 Test failed:", (error as Error).message);
  }
}

async function testValidationErrorScenario() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING VALIDATION ERROR SCENARIO (Real API + Mock Validation Errors)");
  console.log("=".repeat(60));

  const candidateId = process.env.CANDIDATE_ID;
  const baseUrl = process.env.BASE_URL;

  if (!candidateId || !baseUrl) {
    console.error("❌ CANDIDATE_ID and BASE_URL must be set in .env file");
    return;
  }

  const client = new HybridCrossmintClient(candidateId, baseUrl);

  try {
    // Test Phase 1 with validation errors
    console.log("🪐 Testing Phase 1: Creating X pattern with validation errors...");
    client.enableMockMode(true, 'validation_error', 10); // Always fail with validation error
    await createXPattern(client, 2, 2, 3); // Smaller pattern for testing
    console.log("✅ Phase 1 completed successfully!");

  } catch (error) {
    console.log("✅ Expected failure - validation errors should not be retried");
    console.log("Error message:", (error as Error).message);
  }
}

async function testRealGoalMapFetch() {
  console.log("\n" + "=".repeat(60));
  console.log("🧪 TESTING REAL GOAL MAP FETCH");
  console.log("=".repeat(60));

  const candidateId = process.env.CANDIDATE_ID;
  const baseUrl = process.env.BASE_URL;

  if (!candidateId || !baseUrl) {
    console.error("❌ CANDIDATE_ID and BASE_URL must be set in .env file");
    return;
  }

  const client = new HybridCrossmintClient(candidateId, baseUrl);

  try {
    console.log("🔧 Fetching real goal map from API...");
    const goalMap = await client.getGoalMap();
    console.log("✅ Real goal map fetched successfully!");
    console.log("📋 Goal Map Preview (first 3 rows):");
    goalMap.slice(0, 3).forEach((row, index) => {
      console.log(`Row ${index}: [${row.slice(0, 5).join(", ")}...]`);
    });
    console.log(`📊 Total rows: ${goalMap.length}, Total columns: ${goalMap[0]?.length || 0}`);

  } catch (error) {
    console.error("💥 Failed to fetch real goal map:", (error as Error).message);
  }
}

// Main test runner
async function runHybridTests() {
  console.log("🚀 Starting Hybrid Dry-Run Tests");
  console.log("This uses REAL API for goal map but MOCKS entity creation");
  console.log("Make sure your .env file has CANDIDATE_ID and BASE_URL set!");

  await testRealGoalMapFetch();
  await testSuccessfulScenario();
  await testRateLimitScenario();
  await testServerErrorScenario();
  await testValidationErrorScenario();

  console.log("\n" + "=".repeat(60));
  console.log("🎉 All hybrid tests completed!");
  console.log("=".repeat(60));
  console.log("\n📊 What this tested:");
  console.log("• Real API integration (goal map fetching)");
  console.log("• Mock entity creation with different error scenarios");
  console.log("• Your actual main script logic");
  console.log("• Retry mechanisms with real error handling");
  console.log("• Phase 1 and Phase 2 workflows");
}

// Run the tests
runHybridTests().catch(console.error); 