Gwiki = function(opts) {
    Utils.merge(this, {
        home : null,
        parents : [],
        nextItem : null,
        currentItem : null,
        prevItem : null,
        mainMenu : [],
        currentCollection : []
    }, opts || {});
}

Gwiki.prototype = Object.create(Object.prototype);
Gwiki.interface = ['block','init', 'setHome','persist'];

Gwiki.prototype.block = function(str) {
    if (!str) str = "Sorry, something went wrong. Please reload the page.";
    this.ui.block(str);
}

Gwiki.prototype.init = function() {
    // Sanity checks on init
    if (!Utils.implements(GwikiUI.interface, this.ui)) throw "You must define a ui rendering engine by passing a 'ui' option in your options hash that implements the GwikiUI interface";
    if (typeof gapi == 'undefined') throw "This library requires a valid gapi instance. Please see https://developers.google.com/drive/v3/web/quickstart/js for information on initializing the gapi javascript client.";
    if (typeof Storage == 'undefined') {
        gwiki.block('Sorry, your web browser is too old for this. Please upgrade to something more reasonable.');
        return false;
    }

    // Restore previous state, if any
    if (typeof localStorage.gwikiState != 'undefined') {
        var state = JSON.parse(localStorage.gwikiState);
        for (var x in state) this[x] = state;
    }

    // Draw interface
    if (this.home === null) this.ui.askForHome();
    else this.ui.drawStandardInterface();
}

Gwiki.prototype.setHome = function(folderId) {
    var t = this;
    gapi.client.drive.files.get({
        'fileId' : folderId
    }).then(function(response) {
        t.home = response.result;
        t.setExtraAttributes(t.home);
        t.getChildren(folderId).then(function(response) {
            t.mainMenu = t.menuize(response.result.files);
            t.setCurrentItem(t.home, t.mainMenu);
            t.ui.unblock();
            t.persist();
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
    item.isTerminus = (type == 'application/vnd.google-apps.folder');

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
    if (item.mimeType != 'application/vnd.google-apps.folder') {
        this.currentItem = item;
        this.displayCurrentItem();
    } else {
        var t = this;
        this.getChildren(item.id).then(function(response) {
            var children = t.menuize(response.result.files);
            var itemSet = false;
            for (var i = 0; i < children.length; i++) {
                if (children[i].displayName == item.displayName) {
                    t.setCurrentItem(children[i]);
                    itemSet = true;
                    break;
                }
            }
            if (!itemSet) t.setCurrentItem(children[0]);
        });
    }
}




Gwiki.prototype.displayCurrentItem = function() {
    var t = this;
    if (this.currentItem.isText) {
        gapi.client.drive.files.get({
            'fileId' : this.currentItem.id,
            'alt' : 'media'
        }).then(function(response) {
            t.ui.setMainContent(t.markdownParser.makeHtml(response.body));
        });
    } else {
        this.ui.setMainContent('<iframe class="google-doc" src="https://docs.google.com/document/d/'+this.currentItem.id+'/preview">');
    }
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

