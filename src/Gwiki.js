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
    if (!Utils.implements(GwikiUI.interface, this.ui)) throw "You must define a ui rendering engine by passing a 'ui' option in your options hash that implements the GwikiUI interface";

    if (typeof Storage == 'undefined') {
        gwiki.block('Sorry, your web browser is too old for this. Please upgrade to something more reasonable.');
        return false;
    }

    // Restore previous state, if any
    if (typeof localStorage.gwikiState != 'undefined') {
        var state = JSON.parse(localStorage.gwikiState);
        for (var x in state) this[x] = state;
    }

    if (this.home === null) this.ui.askForHome();
    else this.ui.drawStandardInterface();
}

Gwiki.prototype.setHome = function(folderId) {
    this.home = folderId;
    this.setMainMenu(folderId);
    this.setCurrentItem(folderId);
    // TODO: Persist?
}

Gwiki.prototype.setMainMenu = function(homeId) {
    // get list of all files in home
    // save list to "currentItems"
    // find all folders, text docs, and markdown docs
    // alphabetize
    // remove prefixes and suffixes
    // this is the "main menu"
    // list it along the top
}

Gwiki.prototype.setCurrentItem = function(itemId) {
    // if itemId is a doc {
    //   set currentItem = item
    //   ... 
    //this.currentItem = itemId;
}

Gwiki.prototype.persist = function() {
    localStorage.gwikiState = JSON.stringify({
        home : this.home,
        parents : this.parents,
        nextItem : this.nextItem,
        currentItem : this.currentItem,
        prevItem : this.prevItem,
        currentCollection : this.currentCollection
    });
}



