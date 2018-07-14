Utils = {
    merge : function() {
        for (var i = 1; i < arguments.length; i++) {
            for (var x in arguments[i]) {
                // Do deep merge if both are non-array objects and if neither is null
                if (arguments[0][x] !== null && arguments[i][x] !== null && typeof arguments[0][x] == 'object' && !(arguments[0][x] instanceof Array) && typeof arguments[i][x] == 'object' && !(arguments[i][x] instanceof Array)) {
                    Utils.merge(arguments[0][x], arguments[i][x]);
                } else {
                    arguments[0][x] = arguments[i][x];
                }
            }
        }
    },

    implements : function(iface, obj) {
        if (typeof iface == 'string') {
            if (typeof Skel.interfaces == 'undefined' || typeof Skel.interfaces[iface] == 'undefined') throw "No interface '"+iface+"' defined! You can define this interface by adding an array with interface methods and property names to the Skel.interfaces hash like so: `Skel.interfaces['"+iface+"'] = [ 'method1', 'method2', 'property1', 'property2', '...' ];`";
            iface = Skel.interfaces[iface];
        } else {
            if (typeof iface != 'object' || typeof iface.length == 'undefined') throw "You must pass either an array containing method and property names or the name of a defined interface as the first parameter!";
        }

		if (typeof obj == null || typeof obj != 'object') return false;

        for (var i = 0; i < iface.length; i++) {
            if (typeof obj[iface[i]] == 'undefined') return false;
        }
        return true;
    },

    makeObservable : function(classRef) {
        if (typeof classRef.prototype.addEventListener == 'undefined') {
            classRef.prototype.addEventListener = function(eventName, callback) {
                if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
                if (typeof this.eventListeners[eventName] == 'undefined') this.eventListeners[eventName] = [];
                this.eventListeners[eventName].push(callback);
            }
        } else {
            console.warn('Warning: addEventListener already defined on this class. Not overriding, but you may experience unpredictible results.');
        }

        if (typeof classRef.prototype.removeEventListener == 'undefined') {
            classRef.prototype.removeEventListener = function(eventName, callback) {
                if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
                if (typeof this.eventListeners[eventName] == 'undefined') return true;

                for(var i = 0; i < this.eventListeners[eventName].length; i++) {
                    if (this.eventListeners[eventName][i] === callback) {
                        this.eventListeners[eventName].splice(i, 1);
                        break;
                    }
                }
                return true;
            }
        } else {
            console.warn('Warning: removeEventListener already defined on this class. Not overriding, but you may experience unpredictible results.');
        }

        if (typeof classRef.prototype.dispatchEvent == 'undefined') {
            classRef.prototype.dispatchEvent = function(eventName, props) {
                if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
                if (typeof this.eventListeners[eventName] == 'undefined') return true;

                var e = props || {};
                if (typeof e.target != 'undefined') console.warn('WARNING: You\'ve passed a value ("'+e.target+'") on the restricted key `target` of an event object! The `target` property is always used to expose the object that issued the event. Your value will be overwritten.');
                e.target = this;

                var stopPropagation = false;
                var preventDefault = false;
                e.stopPropagation = function() { stopPropagation = true; }
                e.preventDefault = function() { preventDefault = true; }


                for(var i = 0; i < this.eventListeners[eventName].length; i++) {
                    this.eventListeners[eventName][i].call(window, e);
                    if (stopPropagation) break;
                }
                
                return !preventDefault;
            }
        } else {
            console.warn('Warning: dispatchEvent already defined on this class. Not overriding, but you may experience unpredictible results.');
        }
    }
}

