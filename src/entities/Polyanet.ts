import { Entity } from "./Entity";

export class Polyanet extends Entity {
  get apiEndpoint(): string {
    return "/polyanets";
  }
} 