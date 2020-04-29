// Observable Stuff
export interface ObservableInterface {
    addEventListener: (eventName: string, callback: EventListenerCallback) => unknown;
    removeEventListener: (eventName: string , callback: EventListenerCallback) => unknown;
}

export type EventListenerCallback = (e: EventProperties) => unknown;

export type EventData = {
    [key: string]: unknown
}

export type EventProperties = {
    target: unknown;
    stopPropagation: () => void;
    preventDefault: () => void;
    data?: EventData;
}

// For mixins (see typescript docs)
export type Constructor<T = {}> = new (...args: any[]) => T;





// Gwiki stuff

export enum LogLevel { debug, info, warn, error };

export type GwikiConfig = {
    logLevel: LogLevel;
    providerApi: unknown;
}

export enum GwikiConnectionState {
    unsuccessful = -2,
    invalidAppCreds = -1,
    notConnected = 0,
    connecting = 1,
    connected = 2
}

export enum GwikiConnectionObstructions {
}
