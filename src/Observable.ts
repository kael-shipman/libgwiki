import {
    Constructor,
    EventListenerCallback,
    EventData,
    EventProperties,
} from "./Types";

export function Observable<BaseClass extends Constructor<{}>>(Base: BaseClass) {
    return class Observable extends Base {
        protected eventListeners: { [eventName: string]: EventListenerCallback[] } = {};

        constructor(...args: any[]) {
            super(...args);
        }

        public addEventListener(eventName: string, callback: EventListenerCallback) {
            if (typeof this.eventListeners[eventName] == "undefined") {
                this.eventListeners[eventName] = [];
            }
            this.eventListeners[eventName].push(callback);
        }

        public removeEventListener(eventName: string , callback: EventListenerCallback) {
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

        protected dispatchEvent(eventName: string, props?: EventData): boolean {
            if (typeof this.eventListeners[eventName] == "undefined") {
                return true;
            }

            let stopPropagation = false;
            let preventDefault = false;
            let e: EventProperties = {
                target: this,
                stopPropagation: function() { stopPropagation = true; },
                preventDefault: function() { preventDefault = true; },
                data: props
            };

            const context = typeof window !== "undefined" ? window :
                typeof global !== "undefined" ? global :
                null;

            for(let i = 0; i < this.eventListeners[eventName].length; i++) {
                this.eventListeners[eventName][i].call(context, e);
                if (stopPropagation) break;
            }

            return !preventDefault;
        }
    }
}

