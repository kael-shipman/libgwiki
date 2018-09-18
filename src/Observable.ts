import {
    EventListenerCallback,
    EventPublicProps,
    EventFullProps
} from "./Types";
import * as merge from "deepmerge";

export class Observable<T> {
    protected eventListeners: { [eventName: string]: EventListenerCallback<T>[] } = {};

    public addEventListener(eventName: string, callback: EventListenerCallback<T>) {
        if (typeof this.eventListeners[eventName] == "undefined") {
            this.eventListeners[eventName] = [];
        }
        this.eventListeners[eventName].push(callback);
    }

    public removeEventListener(eventName: string , callback: EventListenerCallback<T>) {
        if (typeof this.eventListeners[eventName] == "undefined") {
            return true;
        }

        for(let i = 0; i < this.eventListeners[eventName].length; i++) {
            if (this.eventListeners[eventName][i] === callback) {
                this.eventListeners[eventName].splice(i, 1);
                break;
            }
        }
        return true;
    }

    public dispatchEvent(eventName: string, props?: EventPublicProps): boolean {
        if (typeof this.eventListeners[eventName] == "undefined") {
            return true;
        }

        let stopPropagation = false;
        let preventDefault = false;
        let e: EventFullProps<T> = merge(props, {
            target: this,
            stopPropagation: function() { stopPropagation = true; },
            preventDefault: function() { preventDefault = true; },
        });

        for(let i = 0; i < this.eventListeners[eventName].length; i++) {
            this.eventListeners[eventName][i].call(window, e);
            if (stopPropagation) break;
        }

        return !preventDefault;
    }
}

