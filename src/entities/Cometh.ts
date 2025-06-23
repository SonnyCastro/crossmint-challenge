import { Entity } from "./Entity";

export type Direction = "up" | "down" | "left" | "right";

export class Cometh extends Entity {
  public readonly direction: Direction;

  constructor(row: number, column: number, direction: Direction) {
    super(row, column);
    this.direction = direction;
  }

  get apiEndpoint(): string {
    return "/comeths";
  }

  getPayload(candidateId: string): object {
    const payload = super.getPayload(candidateId);
    return { ...payload, direction: this.direction };
  }
} 