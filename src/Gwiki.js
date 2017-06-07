Gwiki = function(opts) {
    Utils.merge(this, {
        home : null,
        parents : [],
        currentItem : null,
        mainMenu : []
    }, opts || {});
}

Gwiki.prototype = Object.create(Object.prototype);
Gwiki.interface = ['init', 'setHome','persist'];


Gwiki.prototype.init = function() {
    // Sanity checks on init
    if (typeof gapi == 'undefined') throw "This library requires a valid gapi instance. Please see https://developers.google.com/drive/v3/web/quickstart/js for information on initializing the gapi javascript client.";
    if (typeof Storage == 'undefined') {
        this.dispatchEvent('error', {
            type : 'IncompatibleEnvironmentError',
            message : 'Sorry, your web browser is too old for this. Please upgrade to something more reasonable.'
        });
        return false;
    }

    // Restore previous state, if any
    if (typeof localStorage.gwikiState != 'undefined') {
        var state = JSON.parse(localStorage.gwikiState);
        for (var x in state) this[x] = state[x];
    }

    this.initialized = true;
    this.dispatchEvent('init', { gwiki : this });
}

Gwiki.prototype.setHome = function(folderId) {
    var t = this;
    gapi.client.drive.files.get({
        'fileId' : folderId
    }).then(function(response) {
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

            // Set current item to home
            t.setCurrentItem(t.home);

            // Tell listeners that we've set home
            t.dispatchEvent('setHome', { gwiki : t });
        });
    });
}

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
        type == 'application/vnd.google-apps.folder' ||
        type == 'application/vnd.google-apps.document' ||
        type == 'text/x-markdown' ||
        type == 'text/markdown' ||
        item.name.substr(-3) == '.md'
    );

    // See if it's text format
    item.isText = (
        type == 'text/x-markdown' ||
        type == 'text/markdown' ||
        type == 'text/plain' ||
        type == 'text/html'
    );

    // Remove prefixes and suffixes for display names
    var displayName = item.name;
    var prefix = displayName.match(/^[0-9_. -]/);
    var suffix = displayName.match(/\..{1,4}$/);
    if (prefix) displayName = displayName.substr(prefix[0].length);
    if (suffix) displayName = displayName.substr(0, (displayName.length - suffix[0].length));
    item.displayName = displayName;
}




Gwiki.prototype.setCurrentItem = function(item) {
    var t = this;
    if (item.mimeType != 'application/vnd.google-apps.folder') {
        this.currentItem = item;
        if (this.currentItem.isText) {
            gapi.client.drive.files.get({
                'fileId' : this.currentItem.id,
                'alt' : 'media'
            }).then(function(response) {
                t.currentItem.body = response.body;
                t.persist();
                t.dispatchEvent('setCurrentItem', { gwiki : t });
            });
        } else {
            this.persist();
            this.dispatchEvent('setCurrentItem', { gwiki : this });
        }
    } else {
        this.rewindParentsTo(item);
        this.parents.unshift(item);
        this.getChildren(item.id).then(function(response) {
            var children = t.menuize(response.result.files);
            var selected = false;
            // If there's a text file of the same name as the folder, that's our item, that should be the menu header and is selected
            for (var i = 0; i < children.length; i++) {
                if (children[i].displayName == item.displayName) {
                    selected = children.splice(i,1)[0];
                    children.unshift(selected);
                    break;
                }
            }
            // If there's no text file with the same name as the folder, just default to the first item
            if (!selected) selected = children[0];
            item.children = children;
            t.setCurrentItem(selected);
        });
    }
}


Gwiki.prototype.rewindParentsTo = function(item) {
    var selected = false;
    for (var i = 0; i < this.parents.length; i++) {
        if (this.parents[i].id == item.id) {
            selected = i;
            break;
        }
    }
    if (selected !== false) this.parents.splice(selected, (this.parents.length - selected));
}


Gwiki.prototype.getChildren = function(folderId) {
    return gapi.client.drive.files.list({
        'q' : "'"+folderId+"' in parents and trashed = false",
        'pageSize' : 1000,
        'fields' : 'files(id, name, mimeType)'
    });
}

Gwiki.prototype.persist = function() {
    localStorage.gwikiState = JSON.stringify({
        home : this.home,
        parents : this.parents,
        currentItem : this.currentItem,
        mainMenu : this.mainMenu
    });
}










// Event handling

Gwiki.prototype.addEventListener = function(eventName, callback) {
    if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
    if (typeof this.eventListeners[eventName] == 'undefined') this.eventListeners[eventName] = [];
    this.eventListeners[eventName].push(callback);
}

Gwiki.prototype.removeEventListener = function(eventName, callback) {
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

Gwiki.prototype.dispatchEvent = function(eventName, props) {
    if (typeof this.eventListeners == 'undefined') this.eventListeners = {};
    if (typeof this.eventListeners[eventName] == 'undefined') return true;

    var stopPropagation = false;
    var preventDefault = false;
    var e = props || {};
    e.stopPropagation = function() { stopPropagation = true; }
    e.preventDefault = function() { preventDefault = true; }


    for(var i = 0; i < this.eventListeners[eventName].length; i++) {
        this.eventListeners[eventName][i].call(window, e);
        if (stopPropagation) break;
    }
    
    return !preventDefault;
}

