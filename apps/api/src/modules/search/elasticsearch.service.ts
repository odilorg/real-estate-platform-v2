import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from '@elastic/elasticsearch';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  private client: Client | null = null;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    const elasticsearchUrl =
      this.configService.get<string>('ELASTICSEARCH_URL');
    this.isEnabled = !!elasticsearchUrl;

    if (this.isEnabled) {
      this.client = new Client({
        node: elasticsearchUrl,
        auth: {
          username:
            this.configService.get<string>('ELASTICSEARCH_USERNAME') ||
            'elastic',
          password:
            this.configService.get<string>('ELASTICSEARCH_PASSWORD') || '',
        },
      });
      this.logger.log('Elasticsearch client initialized');
    } else {
      this.logger.warn(
        'Elasticsearch is disabled - ELASTICSEARCH_URL not configured',
      );
    }
  }

  async onModuleInit() {
    if (!this.isEnabled || !this.client) {
      return;
    }

    try {
      const health = await this.client.cluster.health();
      this.logger.log(`Elasticsearch cluster health: ${health.status}`);
    } catch (error) {
      this.logger.error('Failed to connect to Elasticsearch:', error);
      this.isEnabled = false;
      this.client = null;
    }
  }

  getClient(): Client | null {
    return this.client;
  }

  isElasticsearchEnabled(): boolean {
    return this.isEnabled && this.client !== null;
  }

  async indexExists(indexName: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.indices.exists({ index: indexName });
      return result;
    } catch (error) {
      this.logger.error(`Error checking if index ${indexName} exists:`, error);
      return false;
    }
  }

  async createIndex(indexName: string, mappings: any): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const exists = await this.indexExists(indexName);
      if (exists) {
        this.logger.log(`Index ${indexName} already exists`);
        return true;
      }

      await this.client.indices.create({
        index: indexName,
        mappings,
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              autocomplete: {
                type: 'custom',
                tokenizer: 'autocomplete',
                filter: ['lowercase'],
              },
              autocomplete_search: {
                type: 'custom',
                tokenizer: 'lowercase',
              },
            },
            tokenizer: {
              autocomplete: {
                type: 'edge_ngram',
                min_gram: 2,
                max_gram: 10,
                token_chars: ['letter', 'digit'],
              },
            },
          },
        },
      });

      this.logger.log(`Index ${indexName} created successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Error creating index ${indexName}:`, error);
      return false;
    }
  }

  async deleteIndex(indexName: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const exists = await this.indexExists(indexName);
      if (!exists) {
        this.logger.log(`Index ${indexName} does not exist`);
        return true;
      }

      await this.client.indices.delete({ index: indexName });
      this.logger.log(`Index ${indexName} deleted successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Error deleting index ${indexName}:`, error);
      return false;
    }
  }

  async indexDocument(
    indexName: string,
    id: string,
    document: any,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.index({
        index: indexName,
        id,
        document,
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error indexing document ${id} in ${indexName}:`,
        error,
      );
      return false;
    }
  }

  async updateDocument(
    indexName: string,
    id: string,
    document: any,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.update({
        index: indexName,
        id,
        doc: document,
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error updating document ${id} in ${indexName}:`,
        error,
      );
      return false;
    }
  }

  async deleteDocument(indexName: string, id: string): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.delete({
        index: indexName,
        id,
        refresh: true,
      });
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting document ${id} from ${indexName}:`,
        error,
      );
      return false;
    }
  }

  async search(indexName: string, query: any): Promise<any> {
    if (!this.isEnabled || !this.client) {
      return { hits: { hits: [], total: { value: 0 } } };
    }

    try {
      const result = await this.client.search({
        index: indexName,
        body: query,
      });
      return result;
    } catch (error) {
      this.logger.error(`Error searching in ${indexName}:`, error);
      return { hits: { hits: [], total: { value: 0 } } };
    }
  }

  async bulkIndex(
    indexName: string,
    documents: Array<{ id: string; data: any }>,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const operations = documents.flatMap((doc) => [
        { index: { _index: indexName, _id: doc.id } },
        doc.data,
      ]);

      const result = await this.client.bulk({
        refresh: true,
        operations,
      });

      if (result.errors) {
        this.logger.error('Bulk indexing had errors');
        return false;
      }

      this.logger.log(
        `Bulk indexed ${documents.length} documents to ${indexName}`,
      );
      return true;
    } catch (error) {
      this.logger.error(`Error bulk indexing to ${indexName}:`, error);
      return false;
    }
  }
}
