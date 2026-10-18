import { FalkorDB } from 'falkordb';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export interface FalkorConfig {
  host: string;
  port: number;
  password?: string;
  graphName: string;
}

export interface QueryResult<T = any> {
  success: boolean;
  data: T[];
  executionTimeMs: number;
  headers?: string[];
  stats?: Record<string, any>;
  error?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  host: string;
  port: number;
  graphName: string;
  error?: string;
  checkedAt: string;
}

class FalkorClientManager {
  private client: FalkorDB | null = null;
  private config: FalkorConfig;
  private lastStatus: ConnectionStatus;

  constructor() {
    this.config = {
      host: process.env.FALKORDB_HOST || '127.0.0.1',
      port: parseInt(process.env.FALKORDB_PORT || '6379', 10),
      password: process.env.FALKORDB_PASSWORD || undefined,
      graphName: process.env.FALKORDB_GRAPH || 'closureloop'
    };

    this.lastStatus = {
      connected: false,
      host: this.config.host,
      port: this.config.port,
      graphName: this.config.graphName,
      checkedAt: new Date().toISOString()
    };
  }

  public getConfig(): FalkorConfig {
    return { ...this.config };
  }

  /**
   * Establishes or returns the FalkorDB connection
   */
  public async getClient(): Promise<FalkorDB> {
    if (this.client) {
      return this.client;
    }

    try {
      this.client = await FalkorDB.connect({
        socket: {
          host: this.config.host,
          port: this.config.port,
          connectTimeout: 2500
        },
        password: this.config.password || undefined
      });
      return this.client;
    } catch (err: any) {
      this.client = null;
      throw new Error(`Failed to connect to FalkorDB at ${this.config.host}:${this.config.port} — ${err.message || err}`);
    }
  }

  /**
   * Performs an active health check against FalkorDB
   */
  public async checkHealth(): Promise<ConnectionStatus> {
    const checkedAt = new Date().toISOString();
    try {
      const client = await this.getClient();
      const graph = client.selectGraph(this.config.graphName);
      // Run a simple query to verify the graph engine is responding
      await graph.query('RETURN 1 AS ping');

      this.lastStatus = {
        connected: true,
        host: this.config.host,
        port: this.config.port,
        graphName: this.config.graphName,
        checkedAt
      };
      return this.lastStatus;
    } catch (err: any) {
      this.client = null;
      this.lastStatus = {
        connected: false,
        host: this.config.host,
        port: this.config.port,
        graphName: this.config.graphName,
        error: err.message || String(err),
        checkedAt
      };
      return this.lastStatus;
    }
  }

  /**
   * Executes a parameterized Cypher query against the configured graph
   */
  public async executeQuery<T = any>(
    cypher: string,
    params: Record<string, any> = {}
  ): Promise<QueryResult<T>> {
    const start = performance.now();
    try {
      const client = await this.getClient();
      const graph = client.selectGraph(this.config.graphName);
      const res = await graph.query(cypher, { params });
      const executionTimeMs = Math.round(performance.now() - start);

      return {
        success: true,
        data: (res.data || []) as T[],
        headers: (res as any).headers || [],
        stats: (res as any).stats || {},
        executionTimeMs
      };
    } catch (err: any) {
      const executionTimeMs = Math.round(performance.now() - start);
      return {
        success: false,
        data: [],
        executionTimeMs,
        error: err.message || String(err)
      };
    }
  }
}

export const falkorClient = new FalkorClientManager();
