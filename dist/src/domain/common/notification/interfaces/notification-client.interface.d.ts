export interface NotificationClientConfig {
    baseUrl: string;
    timeoutMs?: number;
    retries?: number;
    retryDelay?: number;
    enableLogging?: boolean;
}
