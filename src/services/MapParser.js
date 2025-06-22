const Polyanet = require("../entities/Polyanet");
const Soloon = require("../entities/Soloon");
const Cometh = require("../entities/Cometh");

class MapParser {
  static parse(goalMap) {
    const entities = [];
    for (let row = 0; row < goalMap.length; row++) {
      for (let col = 0; col < goalMap[row].length; col++) {
        const cellValue = goalMap[row][col];
        const entity = this.parseCell(row, col, cellValue);
        if (entity) {
          entities.push(entity);
        }
      }
    }
    return entities;
  }

  static parseCell(row, col, cellValue) {
    if (!cellValue || cellValue === "SPACE") {
      return null;
    }

    if (cellValue === "POLYANET") {
      return new Polyanet(row, col);
    }

    if (cellValue.endsWith("_SOLOON")) {
      const color = cellValue.split("_")[0].toLowerCase();
      return new Soloon(row, col, color);
    }

    if (cellValue.endsWith("_COMETH")) {
      const direction = cellValue.split("_")[0].toLowerCase();
      return new Cometh(row, col, direction);
    }

    return null;
  }
}

module.exports = MapParser; 