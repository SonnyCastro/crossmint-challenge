import { Polyanet } from "../entities/Polyanet";
import { Soloon } from "../entities/Soloon";
import { Cometh, Direction } from "../entities/Cometh";
import { IEntity } from "../entities/Entity";

type GoalMap = string[][];

export class MapParser {
  static parse(goalMap: GoalMap): IEntity[] {
    const entities: IEntity[] = [];
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

  static parseCell(row: number, col: number, cellValue: string): IEntity | null {
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
      const direction = cellValue.split("_")[0].toLowerCase() as Direction;
      return new Cometh(row, col, direction);
    }

    return null;
  }
} 