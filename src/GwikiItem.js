/**
 * GwikiItem - an object representing a GoogleDrive object with extra fields pertinent to Gwiki
 */

GwikiItem = function(opts, debug) {
    var t, defaultParams = {
        id: null,
        name: null,
        displayName: null,
        mimeType: null,
        gwikiType: null,
        body: null,
        bodySrc: null,
        isTerminus: null,
        isConsumable: null,
        selected: false,
        children: null,
        parents: null,
        bridge: null,
        isHome: false
    };

    // Get cached item, if possible
    if (typeof opts.id != 'undefined') {
        if (typeof GwikiItem.cache[opts.id] == 'undefined') {
            Utils.merge(this, defaultParams, opts || {});
            GwikiItem.cache[opts.id] = this;
            t = this;
        } else {
            t = GwikiItem.cache[opts.id];
        }
    } else {
        t = this;
        Utils.merge(t, defaultParams, opts || {});
    }


    // Set extra attributes that might not already be set
    t.setExtraAttributes(debug);

    return t;
}

GwikiItem.prototype = Object.create(Object.prototype);
GwikiItem.interface = [ 'id', 'name', 'displayName', 'mimeType', 'gwikiType', 'body', 'bodySrc', 'isTerminus', 'isConsumable', 'selected', 'children', 'parents', 'getParents' ];





GwikiItem.prototype.setExtraAttributes = function() {
    // If it's not a folder, then it's a "terminus" page
    if (this.isTerminus === null) this.isTerminus = (this.mimeType != 'application/vnd.google-apps.folder');

    // If it's terminus, then it's its own bodySrc (otherwise we don't know)
    if (this.bodySrc === null) this.bodySrc = (this.isTerminus ? this : null);

    // See if it's "consumable" by our wiki
    if (this.isConsumable === null && this.mimeType && this.name) {
        this.isConsumable = (
            GwikiItem.consumableTypes.indexOf(this.mimeType) > -1 ||
            this.name.substr(-3) == '.md'
        );
    }

    // See if it's text format
    if (this.gwikiType === null && this.mimeType && this.name) {
        if (this.mimeType == 'text/x-markdown' || this.mimeType == 'text/markdown' || this.mimeType == 'text/plain' || this.name.substr(-3) == '.md') this.gwikiType = 'text/markdown';
        else if (this.mimeType == 'text/html' || this.mimeType == 'application/vnd.google-apps.document') this.gwikiType = 'text/html';
        else this.gwikiType = 'unknown';
    }
    

    // Remove prefixes and suffixes for display names
    if (this.displayName === null && this.name) {
        var displayName = this.name;
        var prefix = displayName.match(/^[0-9_. -]+/);
        var suffix = displayName.match(/\.[^ ]{1,4}$/);
        if (prefix) displayName = displayName.substr(prefix[0].length);
        if (suffix) displayName = displayName.substr(0, (displayName.length - suffix[0].length));
        this.displayName = displayName;
    }
}



GwikiItem.prototype.getChildren = function() {
    this.checkBridge();

    var t = this, children = [], callback;
    var go = { then: function(c) { c(t.children); } };
    var thenGo = { then: function(c) { callback = c; } };

    // If we've already gotten the children, return
    if (this.children !== null) return go;

    this.bridge.getChildrenFor(this).then(function(items) {
        // Instanitate, filter and sort
        items = t.prepareItemsCollection(items);

        // Now separate content child from regular children
        for (var i = 0; i < items.length; i++) {
            // Now, if child has same name as parent and isn't a folder, set it as the bodySrc of parent
            if (items[i].displayName == t.displayName && items[i].isTerminus) {
                if (items[i].isConsumable) t.bodySrc = items[i];
            
            // Else, add it to the children list
            } else children.push(items[i]);
        }

        t.children = children;

        // Then call callback
        if (callback) callback(t.children);
    });

    return { then: function(c) { callback = c; } };
}



GwikiItem.prototype.getBody = function() {
    this.checkBridge();

    var t = this, callback;
    var go = { then: function(c) { c(t.body); } };
    var thenGo = { then: function(c) { callback = c; } };

    // If no bodySrc, can't get body
    if (!this.bodySrc) {
        return go;
    }

    else {
        // If bodySrc not up to date, update it and try again
        if (!this.bodySrc.mimeType || !this.bodySrc.gwikiType) {
            this.bodySrc.update().then(function() {
                t.getBody().then(function() {
                    if (callback) callback(t.body);
                });
            });
            return thenGo;
        }

        // If it's markdown, download the content
        if (this.bodySrc.gwikiType == 'text/markdown' || this.bodySrc.mimeType == 'text/html') {
            this.bridge.downloadContent(this.bodySrc).then(function(body) {
                t.body = body;
                t.bodySrc.body = body;
                if (callback) callback(t.body);
            });

        // If it's a doc, export it as html
        } else if (this.bodySrc.mimeType == 'application/vnd.google-apps.document') {
            this.bridge.exportContent(this.bodySrc).then(function(body) {
                t.body = body;
                t.bodySrc.body = body;
                if (callback) callback(t.body);
            });

        // Otherwise, can't download body content, must embed (just return)
        } else {
            return go;
        }

        return thenGo;
    }
}



GwikiItem.prototype.prepareItemsCollection = function(items) {
    var children = [];

    // Complete info and filter for consumables
    for (var i = 0; i < items.length; i++) {
        // First, add "this" to parents array
        if (items[i].parents && items[i].parents.length) {
            for (j = 0; j < items[i].parents.length; j++) {
                if (items[i].parents[j] == this.id) {
                    items[i].parents[j] = this;
                    added = true;
                    break;
                }
            }
            if (j == items[i].parents[j].length) items[i].parents[j] = this;
        }

        items[i] = new GwikiItem(items[i], true);
        if (!items[i].isConsumable) continue;

        items[i].bridge = this.bridge;

        // Add to children array
        children.push(items[i]);
    }

    // Sort by name
    for (var i = 0; i < children.length - 1; i++) {
        for (var j = i+1; j < children.length; j++) {
            if (children[i].name > children[j].name) {
                var tmp = children[j];
                children[j] = children[i];
                children[i] = tmp;
            }
        }
    }

    return children;
}



GwikiItem.prototype.update = function() {
    var t = this, callback;
    this.checkBridge();
    this.bridge.getItemById(this.id).then(function(item) {
        for (var x in t) {
            if (typeof t[x] == 'function') continue;
            if (typeof item[x] != 'undefined') t[x] = item[x];
        }
        t.setExtraAttributes();
        if (callback) callback(t);
    });
    return { then: function(c) { callback = c; } };
}



GwikiItem.prototype.getParents = function() {
    var t = this, callback;
    var go = { then: function(c) { c(t.parents); } };
    var thenGo = { then: function(c) { callback = c; } };

    if (this.isHome) {
        this.parents = [];
        return go;
    }

    // If we don't have a parents collection, get one and try again
    if (!this.parents) {
        this.update().then(function() {
            t.getParents().then(function() {
                if (callback) callback(t.parents);
            });
        });
        return thenGo;
    }

    // If we do, make sure they're all instantiated
    var returnCounter = 0;
    for (var j = 0; j < this.parents.length; j++) {
        if (typeof this.parents[j] == 'string') {
            this.parents[j] = new GwikiItem({ "id" : this.parents[j], "bridge" : this.bridge });
            this.parents[j].update().then(function() {
                returnCounter++;
                if (returnCounter == t.parents.length && callback) callback(t.parents);
            });
        } else {
            if (!(this.parents[j] instanceof GwikiItem)) throw GwikiItem.strings['errParentInvalid'];
            returnCounter++;
        }
    }

    if (returnCounter == t.parents.length) return go;
    else return thenGo;
}




GwikiItem.prototype.checkBridge = function() {
    if (!Utils.implements(GwikiBridge.interface, this.bridge)) throw "If you pass a `bridge` property, it must be a valid GwikiBridge object (see `GwikiBridge.interface` for methods and properties that you must implement)";
}






GwikiItem.cache = {}
GwikiItem.consumableTypes = [
    'application/vnd.google-apps.folder',
    'application/vnd.google-apps.document',
    'application/vnd.google-apps.spreadsheet',
    'application/vnd.google-apps.presentation',
    'text/x-markdown',
    'text/markdown',
    'text/html',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/pdf',
    'text/plain'
];

GwikiItem.strings = {
    'errParentInvalid' : "Objects in the parents collection must be either strings representing parentIds or fully instantiated GwikiItems."
}

