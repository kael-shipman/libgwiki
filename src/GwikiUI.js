GwikiUI = function(opts) {
    Utils.merge(this, {}, opts || {});

    // Sanity Check
    if (typeof this.root == 'undefined' || typeof this.root.appendChild == 'undefined') throw "You must provide a root ui element as part of the options hash when you construct a GwikiUI object (something like `new GwikiUI({ root: document.getElementById('gwiki-ui') })`)";

    // Make initial UI

    // Header
    this.root.appendChild(document.createElement('header'));
    this.header = this.root.lastChild;
    this.header.className = 'gwiki-header';

    // Title
    this.header.appendChild(document.createElement('h1'));
    this.siteTitle = this.header.lastChild;
    this.siteTitle.className = 'gwiki-site-title';

    // Main navigation
    this.header.appendChild(document.createElement('nav'));
    this.mainMenuContainer = this.header.lastChild;
    this.mainMenuContainer.className = 'gwiki-main-menu';
    this.mainMenu = [];


    // Main Section
    this.root.appendChild(document.createElement('div'));
    this.root.lastChild.className = 'gwiki-main';

    // Sub navigation
    this.root.lastChild.appendChild(document.createElement('nav'));
    this.subMenuContainer = this.root.lastChild.lastChild;
    this.subMenuContainer.className = 'gwiki-sub-menu';
    this.subMenu = [];

    // Main content
    this.root.lastChild.appendChild(document.createElement('article'));
    this.mainContent = this.root.lastChild.lastChild;
    this.mainContent.className = 'gwiki-main-content';


    // Footer
    this.root.appendChild(document.createElement('footer'));
    this.footer = this.root.lastChild;
    this.footer.className = 'gwiki-footer';
}

GwikiUI.prototype = Object.create(Object.prototype);
GwikiUI.interface = ['block','askForHome','drawStandardInterface'];

GwikiUI.prototype.block = function(str) {
    var blocker = document.createElement('div');
    blocker.className = 'blocker';
    blocker.innerHTML = '<div class="content">'+str+'</div>';
    this.root.appendChild(blocker);
    this.blocker = blocker;
    return blocker;
}

GwikiUI.prototype.unblock = function() {
    if (this.blocker) {
        this.blocker.parentElement.removeChild(this.blocker);
        this.blocker = null;
    }
}






// On first load or when resetting home
GwikiUI.prototype.askForHome = function(gwiki) {
    var str = '<form action="?" method="GET" class="homeForm"><label for="homeFolder">Home Folder: <input type="text" id="homeFolder" value="'+(gwiki.home || '')+'" placeholder="e.g., https://drive.google.com/folders/2gja3lkaw3j-faoejsdlkalgalskdga"> <button type="submit">Ok</button></form>';
    var blocker = this.block(str);
    blocker.getElementsByTagName('form')[0].addEventListener('submit', function(e) {
        e.preventDefault();

        var folderId = document.getElementById("homeFolder").value;
        if (folderId.lastIndexOf('/') >= 0) folderId = folderId.substr(folderId.lastIndexOf('/')+1);
        var match = folderId.match(/[^a-zA-Z0-9_-]/);
        if (match) folderId = folderId.substr(0, match.index);

        gwiki.setHome(folderId);
    });
}









// Standard Interface

// Load the interface on init and when home changes
GwikiUI.prototype.loadStandardInterface = function(gwiki) {
    // Title
    document.title = gwiki.home.displayName;
    this.siteTitle.innerHTML = gwiki.home.displayName;
    this.siteTitle.addEventListener('click', function(e) {
        e.preventDefault();
        gwiki.setCurrentItem(gwiki.home);
    });


    // Main Nav
    for (var i = 0; i < this.mainMenu.length; i++) { 
        this.mainMenuContainer.removeChild(this.mainMenu[i]);
    }
    this.mainMenu = [];

    for (var i = 0; i < gwiki.mainMenu.length; i++) {
        this.mainMenu[i] = document.createElement('a');
        this.mainMenu[i].href = "#"+gwiki.mainMenu[i].id;
        this.mainMenu[i].innerHTML = gwiki.mainMenu[i].displayName;
        this.mainMenu[i].setAttribute('data-gid', gwiki.mainMenu[i].id);
        this.mainMenu[i].gobject = gwiki.mainMenu[i];
        this.mainMenuContainer.appendChild(this.mainMenu[i]);

        // Click listener
        this.mainMenu[i].addEventListener('click', function(e) {
            e.preventDefault();
            gwiki.setCurrentItem(e.target.gobject);
        });
    }
}




GwikiUI.prototype.updateStandardInterface = function(gwiki) {
    // Set content
    if (gwiki.currentItem.body) this.mainContent.innerHTML = this.markdownParser.makeHtml(gwiki.currentItem.body);
    else this.mainContent.innerHTML = '<iframe class="google-doc" src="https://docs.google.com/document/d/'+gwiki.currentItem.id+'/preview">'


    // Select main menu item
    var selectedMainItem = gwiki.parents[gwiki.parents.length-2];
    for (var i = 0; i < this.mainMenu.length; i++) {
        if (selectedMainItem && this.mainMenu[i].gobject.name == selectedMainItem.name) this.mainMenu[i].classList.add('selected');
        else this.mainMenu[i].classList.remove('selected');
    }


    // Create sub menu
    this.subMenu = [];
    this.subMenuContainer.innerHTML = '';
    if (gwiki.parents.length > 1) {
        for (var i = 0; i < gwiki.parents[0].children.length; i++) {
            this.subMenu[i] = document.createElement('a');
            this.subMenu[i].href = "#"+gwiki.parents[0].children[i].id;
            this.subMenu[i].innerHTML = gwiki.parents[0].children[i].displayName;
            this.subMenu[i].setAttribute('data-gid', gwiki.parents[0].children[i].id);
            this.subMenu[i].gobject = gwiki.parents[0].children[i];
            this.subMenuContainer.appendChild(this.subMenu[i]);

            // Click listener
            this.subMenu[i].addEventListener('click', function(e) {
                e.preventDefault();
                gwiki.setCurrentItem(e.target.gobject);
            });
        }
    }
}










GwikiUI.prototype.subscribeListeners = function(gwiki) {
    var t = this;
    if (!Utils.implements(Gwiki.interface, gwiki)) throw "You must provide an instance of Gwiki as the argument to this function.";
    gwiki.addEventListener('error', function(e) { t.block(e.message); });
    gwiki.addEventListener('init', function(e) {
        if (e.gwiki.home === null) t.askForHome(e.gwiki);
        else {
            t.loadStandardInterface(e.gwiki);
            t.updateStandardInterface(e.gwiki);
        }
    });
    gwiki.addEventListener('setHome', function(e) {
        if (e.gwiki.home === null) t.askForHome(e.gwiki);
        else {
            t.loadStandardInterface(e.gwiki);
            t.unblock();
        }
    });
    gwiki.addEventListener('setCurrentItem', function(e) {
        t.updateStandardInterface(e.gwiki);
    });
}









// String library

GwikiUI.strings = {
    'title' : 'Gwiki'
}

