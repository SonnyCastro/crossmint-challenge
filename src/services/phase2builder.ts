import { MapParser } from "./MapParser";
import { CrossmintClient } from "../api/client";
import { IEntity } from "../entities/Entity";

export class Phase2Builder {
  private client: CrossmintClient;

  constructor(client: CrossmintClient) {
    this.client = client;
  }

  async buildFromGoalMap(): Promise<void> {
    console.log("🚀 Starting Phase 2: Building from goal map...");
    const goalMap = await this.client.getGoalMap();
    console.log(goalMap, 'goalMap')
    const entities = MapParser.parse(goalMap);
    console.log(entities, 'entities')

    // Create a quick lookup for POLYANET locations for validation
    const polyanetLocations = new Set<string>();
    entities.forEach((entity) => {
      if (entity.constructor.name === "Polyanet") {
        polyanetLocations.add(`${entity.row},${entity.column}`);
      }
    });

    for (const entity of entities) {
      // For SOLOON, validate adjacent POLYANET
      if (entity.constructor.name === "Soloon") {
        const isAdjacent =
          polyanetLocations.has(`${entity.row - 1},${entity.column}`) ||
          polyanetLocations.has(`${entity.row + 1},${entity.column}`) ||
          polyanetLocations.has(`${entity.row},${entity.column - 1}`) ||
          polyanetLocations.has(`${entity.row},${entity.column + 1}`);

        if (!isAdjacent) {
          console.warn(`⏭️ Skipping SOLOON at (${entity.row}, ${entity.column}) — no adjacent POLYANET`, entity);
          continue;
        }
      }

      await this.createEntityWithRetries(entity);
    }

    console.log("✅ Phase 2 completed!");
  }

  async createEntityWithRetries(
    entity: IEntity,
    maxRetries: number = 5
  ): Promise<void> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        await this.client.createEntity(entity);
        await new Promise((resolve) => setTimeout(resolve, 500)); // Delay between requests
        return; // Success
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          console.error(`❌ Failed to create entity at (${entity.row}, ${entity.column}) after ${maxRetries} attempts.`);
          throw error;
        }
        console.log(`🔁 Retrying entity at (${entity.row}, ${entity.column}) in 1s... (${attempts}/${maxRetries})`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}
