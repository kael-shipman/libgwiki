import * as merge from "deepmerge";
import { GwikiNodeInterface } from "./GwikiNode";
import { Observable } from "./Observable";
import {
    LogLevel,
    ObservableInterface,
    GwikiConfig,
} from "./Types";

class _Gwiki {
    protected config: GwikiConfig;
    protected _rootNode: GwikiNodeInterface|null = null;
    protected _currentNode: GwikiNodeInterface|null = null;

    public constructor(config?: GwikiConfig) {
        this.config = merge({
            logLevel: LogLevel.error,
        }, config || {});
    }

    public get rootNode(): GwikiNodeInterface|null {
        return this._rootNode;
    }

    public get currentNode(): GwikiNodeInterface|null {
        return this._currentNode;
    }

    protected log(level: LogLevel, msg: any): _Gwiki {
        if (level >= this.config.logLevel) {
            console.log(msg);
        }
        return this;
    }

    // To anticipate the Observable mixin
    protected dispatchEvent(eventName: string, params?: unknown): boolean { return true; }
}

export const Gwiki = Observable(_Gwiki);
export type GwikiInterface = _Gwiki & ObservableInterface;

