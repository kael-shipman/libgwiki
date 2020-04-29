import * as merge from "deepmerge";
import { GwikiNodeInterface } from "./GwikiNode";
import { Observable } from "./Observable";
import {
    LogLevel,
    ObservableInterface,
    GwikiConfig,
    GwikiConnectionState,
    GwikiConnectionObstructions,
} from "./Types";

export abstract class AbstractGwiki {
    protected config: GwikiConfig;
    protected _rootNode: GwikiNodeInterface|null = null;
    protected _currentNode: GwikiNodeInterface|null = null;
    protected _connectionState: GwikiConnectionState = GwikiConnectionState.notConnected;
    protected _connectionObstructions: GwikiConnectionObstructions[] = [];

    public async constructor(config?: GwikiConfig) {
        this.config = merge({
            logLevel: LogLevel.error,
        }, config || {});

        if (!this.config.providerApi) {
            throw new Error("You must pass a valid provider API in your config");
        }

        return await this.init();
    }

    public get rootNode(): GwikiNodeInterface|null {
        return this._rootNode;
    }

    public get currentNode(): GwikiNodeInterface|null {
        return this._currentNode;
    }

    public get connectionState(): GwikiConnectionState {
        return this._connectionState;
    }

    public get connectionObstructions(): GwikiConnectionObstructions[] {
        return this._connectionObstructions;
    }

    public abstract connect(): boolean;

    public abstract disconnect(): boolean;

    protected abstract async init(): Promise<boolean>;

    protected log(level: LogLevel, msg: any): _Gwiki {
        if (level >= this.config.logLevel) {
            console.log(msg);
        }
        return this;
    }

    // To anticipate the Observable mixin
    protected dispatchEvent(eventName: string, params?: unknown): boolean { return true; }
}

// To export the final, concrete class, you have to mix in the Observable methods and export a final interface like so:
//export const Gwiki = Observable(_Gwiki);
//export type GwikiInterface = _Gwiki & ObservableInterface;

