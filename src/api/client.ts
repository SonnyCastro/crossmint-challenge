import axios, { AxiosInstance } from "axios";
import { IEntity } from "../entities/Entity";
import { RetryManager, RetryConfig } from "../utils/RetryManager";

type GoalMap = string[][];

export class CrossmintClient {
  private readonly candidateId: string;
  private readonly api: AxiosInstance;
  private readonly retryManager: RetryManager;

  constructor(candidateId: string, baseUrl: string, retryConfig?: Partial<RetryConfig>) {
    this.candidateId = candidateId;
    this.api = axios.create({
      baseURL: baseUrl,
      headers: {
        "Content-Type": "application/json",
      },
    });

    this.retryManager = RetryManager.create(retryConfig);
  }

  async createEntity(entity: IEntity): Promise<void> {
    const endpoint = entity.apiEndpoint;
    const payload = entity.getPayload(this.candidateId);
    const context = `(${entity.row}, ${entity.column})`;

    await this.retryManager.execute(
      async () => {
        // console.log(`POST ${endpoint} at ${context}`);
        await this.api.post(endpoint, payload);
      },
      `Creating ${entity.constructor.name}`,
      context
    );
  }

  async getGoalMap(): Promise<GoalMap> {
    return this.retryManager.execute(
      async () => {
        const response = await this.api.get<{ goal: GoalMap }>(
          `/map/${this.candidateId}/goal`
        );
        return response.data.goal;
      },
      "Fetching goal map"
    );
  }
}
