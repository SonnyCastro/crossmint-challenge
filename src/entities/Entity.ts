export interface IEntity {
  row: number;
  column: number;
  readonly apiEndpoint: string;
  getPayload(candidateId: string): object;
}

export abstract class Entity implements IEntity {
  row: number;
  column: number;

  constructor(row: number, column: number) {
    if (this.constructor === Entity) {
      throw new Error("Abstract class 'Entity' cannot be instantiated directly.");
    }
    this.row = row;
    this.column = column;
  }

  abstract get apiEndpoint(): string;

  /**
   * Returns the payload for the API request.
   * Can be extended by subclasses.
   * @param {string} candidateId - The candidate ID for the API.
   */
  getPayload(candidateId: string): object {
    return {
      row: this.row,
      column: this.column,
      candidateId,
    };
  }
}