Gwiki = function(opts) {
    Utils.merge(this, {
        home : null,
        parents : [],
        currentItem : null,
        mainMenu : [],
    }, opts || {});
}



Gwiki.prototype = Object.create(Object.prototype);
Gwiki.interface = ['init', 'setHome','menuize', 'setExtraAttributes', 'setCurrentItem', 'getItemById', 'getChildren', 'addEventListener', 'removeEventListener', 'dispatchEvent' ];


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
    var t = this;
    if (!folderId) {
        this.home = null;
        this.currentItem = null;
        this.parents = [];
        this.mainMenu = [];
        this.dispatchEvent('setHome');
        return;
    }

    // If we're setting it to the current home, just exit
    if (this.home && folderId == this.home.id) return;

    // Otherwise, change home
    this.getItemById(folderId).then(function(response) {
        t.home = response.result;
        t.setExtraAttributes(t.home);
        t.getChildren(folderId).then(function(response) {
            // Create main menu
            t.mainMenu = t.menuize(response.result.files);

            // Remove home document from main menu
            for (var i = 0; i < t.mainMenu.length; i++) {
                if (t.mainMenu[i].displayName == t.home.displayName) {
                    t.mainMenu.splice(i, 1);
                    break;
                }
            }

            // Set current item to defaultDoc or home
            if (!defaultDoc) defaultDoc = t.home;
            t.setCurrentItem(defaultDoc);

            // Tell listeners that we've set home
            t.dispatchEvent('setHome');
        });
    });
}



Gwiki.prototype.setCurrentItem = function(item) {
    var t = this;

    // If we've passed a null item, we're dealing with an empty folder.
    // Set currentItem to null and fall out
    if (!item) {
        this.currentItem = null;
        this.dispatchEvent('setCurrentItem');
        return;
    }


    // If we're already on this item, exit
    if (this.currentItem) {
        if (typeof item == 'string') {
            if (item == this.currentItem.id) return;
        } else if (item.id == this.currentItem.id) return
    }


    // If item is a string, we need to get an object from it and try again
    if (typeof item == 'string') {
        this.getItemById(item).then(function(response) {
            var item = response.result;
            t.setExtraAttributes(item);
            t.setCurrentItem(item);
        });
        return;
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
            });

        // If it's a doc, export it as html
        } else if (this.currentItem.mimeType == 'application/vnd.google-apps.document') {
            gapi.client.drive.files.export({
                fileId : this.currentItem.id,
                mimeType : 'text/html'
            }).then(function(response) {
                t.currentItem.body = response.body;
                t.dispatchEvent('setCurrentItem');
            });

        // Otherwise, let the ui figure out what to do with it
        } else {
            this.dispatchEvent('setCurrentItem');
        }


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
            t.setCurrentItem(selected);
        });
    }
}









// gapi abstractions

Gwiki.prototype.getItemById = function(id) {
    return gapi.client.drive.files.get({
        'fileId' : id
    });
}



Gwiki.prototype.getChildren = function(folderId) {
    return gapi.client.drive.files.list({
        'q' : "'"+folderId+"' in parents and trashed = false",
        'pageSize' : 1000,
        'fields' : 'files(id, name, mimeType)'
    });
}











// Utility functions

Gwiki.prototype.menuize = function(items) {
    var menuItems = [];
    for (var i = 0; i < items.length; i++) {
        this.setExtraAttributes(items[i]);
        if (items[i].isConsumable) menuItems.push(items[i]);
    }

    // Sort by name
    for (var i = 0; i < menuItems.length - 1; i++) {
        for (var j = i+1; j < menuItems.length; j++) {
            if (menuItems[i].name > menuItems[j].name) {
                var tmp = menuItems[j];
                menuItems[j] = menuItems[i];
                menuItems[i] = tmp;
            }
        }
    }

    return menuItems;
}

Gwiki.prototype.setExtraAttributes = function(item) {
    var type = item.mimeType;
    
    // If it's not a folder, then it's a "terminus" page
    item.isTerminus = (type != 'application/vnd.google-apps.folder');

    // See if it's "consumable" by our wiki
    item.isConsumable = (
        Gwiki.consumableTypes.indexOf(type) > -1 ||
        item.name.substr(-3) == '.md'
    );

    // See if it's text format
    if (type == 'text/x-markdown' || type == 'text/markdown' || type == 'text/plain' || item.name.substr(-3) == '.md') item.gwikiType = 'text/markdown';
    else if (type == 'text/html' || type == 'application/vnd.google-apps.document') item.gwikiType = 'text/html';
    else item.gwikiType = 'unknown';
    

    // Remove prefixes and suffixes for display names
    var displayName = item.name;
    var prefix = displayName.match(/^[0-9_. -]/);
    var suffix = displayName.match(/\..{1,4}$/);
    if (prefix) displayName = displayName.substr(prefix[0].length);
    if (suffix) displayName = displayName.substr(0, (displayName.length - suffix[0].length));
    item.displayName = displayName;
}







Gwiki.consumableTypes = [
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

