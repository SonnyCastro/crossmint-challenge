const { createPolyanet } = require("../api/client");

async function createXPattern(startRow = 0, startColumn = 0, size = 11) {
  for (let i = 0; i < size; i++) {
    const row = startRow + i;

    // Main diagonal
    const col1 = startColumn + i;
    await createPolyanet(row, col1);

    // Anti-diagonal (avoid duplication at center)
    const col2 = startColumn + (size - 1 - i);
    if (col1 !== col2) {
      await createPolyanet(row, col2);
    }
  }
}

module.exports = {
  createXPattern
};
