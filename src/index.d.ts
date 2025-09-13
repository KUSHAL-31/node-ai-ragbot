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
        stt?: {
            model?: string;
            language?: string;
        };
        tts?: {
            model?: string;
            voice?: string;
        };
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

export declare function expressRagBot(
    app: Express,
    config: RagConfig
): Promise<void>;
