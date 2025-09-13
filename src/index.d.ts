import type { Express } from "express";

export interface RagSources {
    files?: string[];
    urls?: string[];
}

export interface RagTextSplit {
    chunkSize?: number;
    chunkOverlap?: number;
}

export interface RagConfig {
    sources: RagSources;
    rag?: {
        maxPagesPerSite?: number;
        textSplit?: RagTextSplit;
        topK?: number;
    };
    openai: {
        apiKey: string;
        embeddings?: { model?: string };
        chat?: {
            model?: string;
            temperature?: number;
            maxTokens?: number;
            promptTemplate?: string;
        };
        whisper?: {
            model?: string;
            language?: string;
            response_format?: string;
        };
        tts?: {
            model?: string;
            voice?: string;
            response_format?: string;
        };
    };
    http?: {
        cors?: {
            origins?: string[];
            credentials?: boolean;
        };
        multer?: { fileSizeMb?: number };
    };
    port?: number;
    logger?: Console;
}

export interface RagbotInitResult {
    vectorStore: any;
    cfg: RagConfig;
    ragbotRouter: any;
    chatHandler: any;
    voiceHandler: any;
}

export declare function initRagVoiceBot(
    config: RagConfig
): Promise<RagbotInitResult>;

export declare function initializeRagbot(
    app: Express,
    config: RagConfig
): Promise<void>;
