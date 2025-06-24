import { MapParser } from "./MapParser";
import { CrossmintClient } from "../api/client";

export class Phase2Builder {
  private client: CrossmintClient;

  constructor(client: CrossmintClient) {
    this.client = client;
  }

  async buildFromGoalMap(): Promise<void> {
    try {
      const goalMap = await this.client.getGoalMap();
      console.log("📋 Goal map retrieved successfully");

      const entities = MapParser.parse(goalMap);
      console.log(`🔍 Parsed ${entities.length} entities from goal map`);

      // Create a quick lookup for POLYANET locations for validation
      const polyanetLocations = new Set<string>();
      entities.forEach((entity) => {
        if (entity.constructor.name === "Polyanet") {
          polyanetLocations.add(`${entity.row},${entity.column}`);
        }
      });

      // Debug: Print all Polyanet locations to be created
      console.log("Total Polyanets:", polyanetLocations.size);

      // --- EMOJI MAP HELPERS ---
      const EMOJI = {
        SPACE: "🌌",
        POLYANET: "🪐",
        SOLOON: "🌕",
        COMETH: "☄️"
      };
      function cellToEmoji(cell: string): string {
        if (!cell || cell === "SPACE") return EMOJI.SPACE;
        if (cell === "POLYANET") return EMOJI.POLYANET;
        if (cell.endsWith("_SOLOON")) return EMOJI.SOLOON;
        if (cell.endsWith("_COMETH")) return EMOJI.COMETH;
        return "?";
      }
      function entityToEmoji(entity: any): string {
        if (entity.constructor.name === "Polyanet") return EMOJI.POLYANET;
        if (entity.constructor.name === "Soloon") return EMOJI.SOLOON;
        if (entity.constructor.name === "Cometh") return EMOJI.COMETH;
        return EMOJI.SPACE;
      }

      // --- PRINT GOAL MAP AS EMOJI GRID ---
      console.log("\n=== GOAL MAP (EMOJI GRID) ===");
      goalMap.forEach((row, i) => {
        const line = row.map(cellToEmoji).join("");
        console.log(line);
      });
      console.log("============================\n");

      // --- Prepare a 30x30 grid for created entities ---
      const gridSize = goalMap.length;
      const entityGrid: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(EMOJI.SPACE));

      let createdCount = 0;
      let skippedCount = 0;
      let createdEntities: string[] = [];
      const createdPolyanetSet = new Set<string>();

      for (const entity of entities) {
        try {
          if (entity.constructor.name === "Polyanet") {
            const key = `${entity.row},${entity.column}`;
            if (createdPolyanetSet.has(key)) {
              console.warn(`Skipping duplicate Polyanet at (${entity.row},${entity.column})`);
              continue;
            }
            createdPolyanetSet.add(key);
          }

          // For SOLOON, validate adjacent POLYANET
          if (entity.constructor.name === "Soloon") {
            const adjacents = [
              [entity.row - 1, entity.column],
              [entity.row + 1, entity.column],
              [entity.row, entity.column - 1],
              [entity.row, entity.column + 1],
            ];
            const isAdjacent = adjacents.some(([r, c]) => polyanetLocations.has(`${r},${c}`));
            if (!isAdjacent) {
              console.warn(`⏭️ Skipping SOLOON at (${entity.row}, ${entity.column}) — no adjacent POLYANET`);
              console.debug(`  Checked adjacents: ${adjacents.map(([r, c]) => `${r},${c}`).join(" | ")}`);
              skippedCount++;
              continue;
            } else {
              console.debug(`✅ SOLOON at (${entity.row}, ${entity.column}) has adjacent POLYANET.`);
            }
          }

          await this.client.createEntity(entity);
          createdCount++;
          createdEntities.push(`${entity.constructor.name} at (${entity.row},${entity.column})`);
          // Fill the entity grid for visual comparison
          entityGrid[entity.row][entity.column] = entityToEmoji(entity);

          // Note: No manual delay needed - CrossmintClient uses RetryManager with exponential backoff
          // and proper rate limiting (HTTP 429 handling) for all API calls

        } catch (error) {
          console.error(`❌ Failed to create ${entity.constructor.name} at (${entity.row}, ${entity.column}):`, error);
          // Continue with other entities instead of failing the entire process
        }
      }

      // --- PRINT CREATED ENTITY GRID AS EMOJI GRID ---
      console.log("\n=== YOUR CREATED MEGAVERSE (EMOJI GRID) ===");
      entityGrid.forEach(row => {
        console.log(row.join(""));
      });
      console.log("==========================================\n");

      // --- COMPARE GRIDS ---
      function compareGrids(goalMap: string[][], entityGrid: string[][]) {
        let differences = 0;
        for (let row = 0; row < goalMap.length; row++) {
          for (let col = 0; col < goalMap[row].length; col++) {
            if (cellToEmoji(goalMap[row][col]) !== entityGrid[row][col]) {
              console.log(`❌ Difference at (${row},${col}): goal=${cellToEmoji(goalMap[row][col])}, created=${entityGrid[row][col]}`);
              differences++;
            }
          }
        }
        if (differences === 0) {
          console.log('✅ Your created grid matches the goal map exactly!');
        } else {
          console.log(`❌ Found ${differences} differences between your grid and the goal map.`);
        }
      }
      compareGrids(goalMap, entityGrid);

      // Debug: Print all created entities
      console.log(`Total entities created: ${createdCount}, Skipped: ${skippedCount}`);

    } catch (error) {
      console.error("💥 Phase 2 failed:", error);
      throw error;
    }
  }
}