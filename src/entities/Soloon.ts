import { Entity } from "./Entity";

export class Soloon extends Entity {
  public readonly color: string;

  constructor(row: number, column: number, color: string) {
    super(row, column);
    this.color = color;
  }

  get apiEndpoint(): string {
    return "/soloons";
  }

  getPayload(candidateId: string): object {
    const payload = super.getPayload(candidateId);
    return { ...payload, color: this.color };
  }
} 