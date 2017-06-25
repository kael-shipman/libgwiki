/**
 * Main library for maintaining data structures necessary for displaying Google Drive hierarchies as
 * wikis.
 *
 * @param Hash opts -- options to override defaults
 *      GwikiObject home - the initial root object
 *
 * TBC....
 */

Gwiki = function(opts) {
    Utils.merge(this, {
        home : null,
        currentItem : null,
        navStack : []
    }, opts || {});

    // A queue for storing commands that require bridge, if bridge isn't yet initialized
    this.queue = [];
}



Gwiki.prototype = Object.create(Object.prototype);
Gwiki.interface = ['init', 'setHome','menuize', 'setGwikiAttributes', 'setCurrentItem', 'getItemById', 'getChildren', 'addEventListener', 'removeEventListener', 'dispatchEvent' ];


// Add observable characteristics
Utils.makeObservable(Gwiki);


Gwiki.prototype.init = function(bridge) {
    this.bridge = bridge;

    // Sanity checks on init
    if (!Utils.implements(GwikiBridge.interface, this.bridge)) throw "This library requires a valid Bridge instance. Usually you pass this into the `Gwiki::init` function (this function) when `GwikiUI` is initialized.";

    this.initialized = true;
    this.dispatchEvent('init');
}



Gwiki.prototype.setHome = function(folderId, defaultDoc) {
    var t = this, callback;
    var thenGo = { then : function(c) { callback = c; } };
    var go = { then : function(c) { c.call(t, t.home); } };

    // Setting (or resetting) home -- clear the nav stack
    this.navStack = [];

    // If home set to null, clear current item, too
    if (!folderId) {
        this.home = null;
        this.currentItem = null;
        this.dispatchEvent('setHome');
        return go;
    }

    // If we're setting it to the current home, just exit
    if (this.home && folderId == this.home.id) return go;

    // Otherwise, change home
    this.getItemById(folderId).then(function(home) {
        t.home = home;
        t.home.getChildren().then(function(children) {
            // Set current item to defaultDoc or home
            if (!defaultDoc) defaultDoc = t.home;
            t.setCurrentItem(defaultDoc);

            // Tell listeners that we've set home
            t.dispatchEvent('setHome');
            if (callback) callback.call(t, t.home);
        });
    });

    return thenGo;
}



Gwiki.prototype.setCurrentItem = function(item) {
    var t = this, callback;
    var thenGo = { then : function(c) { callback = c; } };
    var go = { then : function(c) { c.call(t, t.currentItem); } };

    // If we've passed a null item, we're dealing with an empty folder.
    // Set currentItem to null and fall out
    if (!item) {
        this.currentItem = null;
        this.dispatchEvent('setCurrentItem');
        return go;
    }


    // If we're already on this item, exit
    if (this.currentItem) {
        if (typeof item == 'string') {
            if (item == this.currentItem.id) return go;
        } else if (item.id == this.currentItem.id) return go;
    }


    // If item is a string, we need to get an object from it and try again
    if (typeof item == 'string') {
        this.getItemById(item).then(function(item) {
            t.setCurrentItem(item).then(function(item2) {
                if (callback) callback.call(t, t.currentItem);
            };
        });
        return thenGo;
    }


    // Remove all parents that are not anscestors of item
    while (this.parents.length > 1) {
        var found = false;
        for (var i = 0; i < this.parents[0].children.length; i++) {
            if (item.id == this.parents[0].children[i].id) found = true;
            if (found) break;
        }
        if (found) break;
        this.parents.shift();
    }
    

    // If we've reached a file...
    if (item.mimeType != 'application/vnd.google-apps.folder') {
        // Set the current item to the doc
        this.currentItem = item;
        
        // If it's markdown, download the content
        if (this.currentItem.gwikiType == 'text/markdown') {
            gapi.client.drive.files.get({
                'fileId' : this.currentItem.id,
                'alt' : 'media'
            }).then(function(response) {
                t.currentItem.body = response.body;
                t.dispatchEvent('setCurrentItem');
                if (callback) callback.call(t, t.currentItem);
            });

        // If it's a doc, export it as html
        } else if (this.currentItem.mimeType == 'application/vnd.google-apps.document') {
            gapi.client.drive.files.export({
                fileId : this.currentItem.id,
                mimeType : 'text/html'
            }).then(function(response) {
                t.currentItem.body = response.body;
                t.dispatchEvent('setCurrentItem');
                if (callback) callback.call(t, t.currentItem);
            });

        // Otherwise, let the ui figure out what to do with it
        } else {
            this.dispatchEvent('setCurrentItem');
            if (callback) callback.call(t, t.currentItem);
        }
        return thenGo;


    // If we've reached a folder, fall through to the most appropriate doc
    } else {
        // Add this folder to the parent hierarchy
        this.parents.unshift(item);

        // Get children
        this.getChildren(item.id).then(function(response) {
            var children = t.menuize(response.result.files);
            var selected = null;

            // See if there's a doc with the same name as the folder. If so, that's our selection
            for (var i = 0; i < children.length; i++) {
                if (children[i].displayName == item.displayName) {
                    selected = children.splice(i,1)[0];
                    children.unshift(selected);
                    break;
                }
            }

            // If there's no doc with the same name as the folder, just default to the first item
            if (!selected) selected = children[0];

            // Record children on this parent node
            item.children = children;

            // Now try again with the selection
            t.setCurrentItem(selected).then(function(item) {
                if (callback) callback.call(t, t.currentItem);
            };
            return thenGo;
        });
    }
}









// Object getters

Gwiki.prototype.getItemById = function(id) {
    var t = this, thenCallback;
    this.bridge.getItemById(id).then(function(itemProps) {
        itemProps.bridge = t.bridge;
        // TODO: Use factory to instantiate
        thenCallback.call(t, new GwikiItem(itemProps));
    });

    return { then: function(callback) { thenCallback = callback; } };
}


