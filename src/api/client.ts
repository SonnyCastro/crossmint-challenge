import axios, { AxiosInstance } from "axios";
import { IEntity } from "../entities/Entity";

type GoalMap = string[][];

export class CrossmintClient {
  private readonly candidateId: string;
  private readonly api: AxiosInstance;

  constructor(candidateId: string, baseUrl: string) {
    this.candidateId = candidateId;
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async createEntity(entity: IEntity): Promise<void> {
    const endpoint = entity.apiEndpoint;
    const payload = entity.getPayload(this.candidateId);

    try {
      console.log(`POST ${endpoint} at (${entity.row}, ${entity.column})`);
      await this.api.post(endpoint, payload);
    } catch (error) {
      const axiosError = error as import('axios').AxiosError;
      console.error(
        `Error creating entity at (${entity.row}, ${entity.column}):`,
        axiosError.response ? axiosError.response.data : axiosError.message
      );
      throw error;
    }
  }

  async getGoalMap(): Promise<GoalMap> {
    try {
      const response = await this.api.get<{ goal: GoalMap }>(
        `/map/${this.candidateId}/goal`
      );
      return response.data.goal;
    } catch (error) {
      const axiosError = error as import('axios').AxiosError;
      console.error(
        "Error fetching goal map:",
        axiosError.response ? axiosError.response.data : axiosError.message
      );
      throw error;
    }
  }
}
