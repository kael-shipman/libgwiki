Utils = {
    merge : function() {
        for (var i = 1; i < arguments.length; i++) {
            for (var x in arguments[i]) arguments[0][x] = arguments[i][x];
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
    }
}

