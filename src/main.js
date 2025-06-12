require("dotenv").config();
const { createXPattern } = require("./services/megaverseBuilder");
const { buildFromGoalMap } = require("./services/phase2builder");

(async () => {
  // console.log("Creating X-shape POLYanets...");
  // await createXPattern(2, 2, 7); // This will place the pattern starting at row 2, column 2
  console.log("🧠 Fetching and building the full Crossmint logo map...");
  await buildFromGoalMap();
  console.log("✅ Megaverse completed!");
})();
