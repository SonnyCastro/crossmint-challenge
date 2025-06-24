import "dotenv/config";
import axios from "axios";

async function cleanupGrid() {
  const candidateId = process.env.CANDIDATE_ID!;
  const baseUrl = process.env.BASE_URL!;
  const gridSize = 30; // Assuming 30x30 grid

  let deleted = 0;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Delete Polyanet
      try {
        await axios.delete(`${baseUrl}/polyanets`, {
          data: { row, column: col, candidateId },
          headers: { "Content-Type": "application/json" }
        });
        console.log(`Deleted Polyanet at (${row},${col})`);
        deleted++;
      } catch { }
      // Delete all possible Soloon colors
      for (const color of ["red", "blue", "purple", "white"]) {
        try {
          await axios.delete(`${baseUrl}/soloons`, {
            data: { row, column: col, color, candidateId },
            headers: { "Content-Type": "application/json" }
          });
          console.log(`Deleted Soloon (${color}) at (${row},${col})`);
          deleted++;
        } catch { }
      }
      // Delete all possible Cometh directions
      for (const direction of ["up", "down", "left", "right"]) {
        try {
          await axios.delete(`${baseUrl}/comeths`, {
            data: { row, column: col, direction, candidateId },
            headers: { "Content-Type": "application/json" }
          });
          console.log(`Deleted Cometh (${direction}) at (${row},${col})`);
          deleted++;
        } catch { }
      }
    }
  }

  console.log(`Cleanup complete. Deleted ${deleted} entities (Polyanets, Soloons, Comeths).`);
}

cleanupGrid(); 