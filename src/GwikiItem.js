/**
 * GwikiItem - an object representing a GoogleDrive object with extra fields pertinent to Gwiki
 */

GwikiItem = function(opts) {
    Utils.merge(this, {
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
        bridge: null
    }, opts || {});

    // Check to see if any parent or child collections contain invalid items
    var check = {};
    if (this.children) check.children = this.children;
    if (this.parents) check.parents = this.parents;
    for (var x in check) {
        for (var j = 0; j < check[x].length; j++) {
            if (!Utils.implements(GwikiItem.interface, check[x][j])) {
                throw 'Invalid object passed to ' + x + ' array! If you pass ' + x + ' into the constructor of a GwikiItem, they must already be GwikiItem objects (i.e., implement the interface defined at `GwikiItem.interface`). (Object #' + j + ')';
            }
        }
    }

    // Set extra attributes that might not already be set
    this.setAttributes();
}

GwikiItem.prototype = Object.create(Object.prototype);
GwikiItem.interface = [ 'id', 'name', 'displayName', 'mimeType', 'gwikiType', 'body', 'bodySrc', 'isTerminus', 'isConsumable', 'selected', 'children', 'parents', 'setChildren', 'setParents' ];





GwikiItem.prototype.setAttributes = function() {
    // If it's not a folder, then it's a "terminus" page
    if (this.isTerminus === null) this.isTerminus = (this.mimeType != 'application/vnd.google-apps.folder');

    // If it's terminus, then it's its own bodySrc (otherwise we don't know)
    if (this.bodySrc === null) this.bodySrc = (this.isTerminus ? this.id : null);

    // See if it's "consumable" by our wiki
    if (this.isConsumable === null) {
        this.isConsumable = (
            GwikiItem.consumableTypes.indexOf(this.mimeType) > -1 ||
            this.name.substr(-3) == '.md'
        );
    }

    // See if it's text format
    if (this.gwikiType === null) {
        if (this.mimeType == 'text/x-markdown' || this.mimeType == 'text/markdown' || this.mimeType == 'text/plain' || this.name.substr(-3) == '.md') this.gwikiType = 'text/markdown';
        else if (this.mimeType == 'text/html' || this.mimeType == 'application/vnd.google-apps.document') this.gwikiType = 'text/html';
        else this.gwikiType = 'unknown';
    }
    

    // Remove prefixes and suffixes for display names
    if (this.displayName === null) {
        var displayName = this.name;
        var prefix = displayName.match(/^[0-9_. -]/);
        var suffix = displayName.match(/\..{1,4}$/);
        if (prefix) displayName = displayName.substr(prefix[0].length);
        if (suffix) displayName = displayName.substr(0, (displayName.length - suffix[0].length));
        this.displayName = displayName;
    }
}



GwikiItem.prototype.getChildren = function() {
    this.checkBridge();

    var t = this, children = [], callback;
    var go = { then: function(c) { c.call(t, t.children); } };
    var thenGo = { then: function(c) { callback = c; } };

    // If we've already gotten the children, return
    if (this.children !== null) return go;

    this.bridge.getChildrenFor(this).then(function(items) {
        // Instanitate, filter and sort
        t.prepareItemsCollection(items);

        // Now separate content child from regular children
        for (var i = 0; i < items.length; i++) {
            // Now, if child has same name as parent and isn't a folder, set it as the bodySrc of parent
            if (items[i].displayName == this.displayName && items[i].isTerminus) {
                if (items[i].isConsumable) this.bodySrc = items[i].id;
            
            // Else, add it to the children list
            } else children.push(items[i]);
        }

        this.children = children;

        // Then call callback
        if (callback) callback.call(t, t.children);
    });

    return { then: function(c) { callback = c; } };
}



GwikiItem.prototype.prepareItemsCollection = function(items) {
    var children = [];

    // Complete info and filter for consumables
    for (var i = 0; i < items.length; i++) {
        items[i] = new GwikiItem(items[i]);
        if (!items[i].isConsumable) continue;
        items[i].bridge = this.bridge;
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




Gwiki.prototype.checkBridge = function() {
    if (!Utils.implements(GwikiBridge.interface, this.bridge)) throw "If you pass a `bridge` property, it must be a valid GwikiBridge object (see `GwikiBridge.interface` for methods and properties that you must implement)";
}






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

