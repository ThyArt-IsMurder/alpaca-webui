import fs from 'fs';
import { chunkTextBySentences } from 'matts-llm-tools';
import { DocumentReader } from './document-reader';
import { VectorDatabaseClassName, weaviateClient } from '@/db/vector-db';
import { embedMessage } from './embed-message';
import { type TProviderSettings } from '@/lib/types';

export type DocumentEmbeddingRespopnse = {
  success: boolean;
  errorMessage: string;
  embedModel: string;
  textCharacterCount: number;
  noOfChunks: number;
  totalDocumentTokens: number;
};

export type DocumentVectorSchema = {
  text: string;
  file: string;
  chunkIndex: number;
  chunkTotal: number;
  embedding: number[];
  totalTokens?: number;
};

export class DocumentEmbedding {
  private readonly filePath: string;
  private readonly filename: string;
  private readonly baseFilePath = './uploads/';

  constructor(filename: string) {
    if (!filename) {
      throw new Error('Filename is required.');
    }
    const filePath = `${this.baseFilePath}${filename}`;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    this.filename = filename;
    this.filePath = filePath;
  }

  private async batchVectorsToDatabase(list: DocumentVectorSchema[]): Promise<boolean> {
    try {
      let batcher = weaviateClient.batch.objectsBatcher();
      let counter = 0;
      const batchSize = 100;

      if (list.length === 0) {
        console.warn('No content extracted from document.');
        return false;
      }

      for (const data of list) {
        batcher = batcher.withObject({
          class: VectorDatabaseClassName,
          properties: {
            text: data.text,
            file: data.file,
            chunkIndex: data.chunkIndex++,
            chunkTotal: data.chunkTotal,
            totalTokens: data.totalTokens,
          },
          vector: data.embedding,
        });

        if (counter++ == batchSize) {
          await batcher.do();

          counter = 0;
          batcher = weaviateClient.batch.objectsBatcher();
        }
      }

      await batcher.do();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error when batching to vector database: ', error.message);
      } else {
        console.error('Failed to batch vectors to database.');
      }
      return false;
    }

    return true;
  }

  private async embedChunks(
    chunks: string[],
    filename: string,
    model: string,
    providerSetting: TProviderSettings
  ): Promise<DocumentVectorSchema[]> {
    const documentVectors: DocumentVectorSchema[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      const data = await embedMessage(chunk ?? '', model, providerSetting);

      const chunkjson = {
        text: chunk ?? '',
        file: filename,
        embedding: data.embedding,
        chunkIndex: i,
        chunkTotal: chunks.length,
        totalTokens: data.totalTokens,
      };
      documentVectors.push(chunkjson);
    }

    return documentVectors;
  }

  private async getFileContent(): Promise<string> {
    const reader = new DocumentReader(this.filePath);
    return await reader.getFileContent();
  }

  async EmbedAndPersistDocument(
    embedModel: string,
    providerSetting: TProviderSettings
  ): Promise<DocumentEmbeddingRespopnse> {
    try {
      // Step 1: Get file content
      const fileContent = await this.getFileContent();

      // Step 2: Create document chunks
      const documentChunks = chunkTextBySentences(fileContent, 8, 0);
      console.log(`Start embedding document: ${this.filename}`);
      console.log(`Document has ${documentChunks.length} chunks.`);

      // Step 3: Embed chunks
      const documentVectors = await this.embedChunks(documentChunks, this.filename, embedModel, providerSetting);
      console.log(`Finished embedding document: ${this.filename}`);

      // Step 4: Store in database
      const success = await this.batchVectorsToDatabase(documentVectors);
      console.log(`success: ${success.toString()}`);

      return {
        success,
        errorMessage: '',
        embedModel,
        textCharacterCount: fileContent.length,
        noOfChunks: documentChunks.length,
        totalDocumentTokens: documentVectors.reduce((a, b) => (b.totalTokens == undefined ? 0 : a + b.totalTokens), 0),
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error during document embedding',
        embedModel,
        textCharacterCount: 0,
        noOfChunks: 0,
        totalDocumentTokens: 0,
      };
    }
  }
}
