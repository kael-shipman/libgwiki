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
    var str = '<form action="?" method="GET" class="homeForm"><label for="homeFolder">'+GwikiUI.strings['prompt-homefolder']+'<input type="text" id="homeFolder" value="'+(gwiki.home || '')+'" placeholder="e.g., https://drive.google.com/folders/2gja3lkaw3j-faoejsdlkalgalskdga"> <button type="submit">Ok</button></form>';
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
    // If there's no current item selected, reset interface
    if (!gwiki.currentItem) {
        this.mainContent.innerHTML = GwikiUI.strings['err-nocontent'].replace('$id', gwiki.parents[0].id);
    } else {
        // Set content
        if (gwiki.currentItem.gwikiType == 'text/markdown') this.mainContent.innerHTML = this.markdownParser.makeHtml(gwiki.currentItem.body);
        else if (gwiki.currentItem.gwikiType == 'text/html') this.mainContent.innerHTML = this.cleanHtml(gwiki.currentItem.body);
        else {
            var str = this.getEmbedString(gwiki);
            this.mainContent.innerHTML = this.getEmbedString(gwiki);
        }
        this.parseContentLinks(gwiki);
    }


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

            // If this looks like the group header, make it stand out
            if (gwiki.parents[0].displayName == gwiki.parents[0].children[i].displayName) this.subMenu[i].classList.add('gwiki-group-header');

            // If this one is selected, show that
            if (gwiki.currentItem && gwiki.parents[0].children[i].displayName == gwiki.currentItem.displayName) this.subMenu[i].classList.add('selected');
        }
    }
}


GwikiUI.prototype.parseContentLinks = function(gwiki) {
    var links = this.mainContent.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        // If we're instructed not to touch it, don't touch it
        if (links[i].classList.contains('gwiki-passthrough')) continue;

        // If this is a google drive link, try to load it on this page
        // TODO: Figure out how to fall back if this is not a page in this hierarchy
        if (links[i].href.match(/\.google\.com\/.+\/d\/[a-zA-Z0-9._-]+/)) {
            links[i].addEventListener('click', function(e) {
                var id = e.target.href.match(/\.google\.com\/.+\/d\/([^\/]+)/);

                // If we can't figure it out, leave it
                if (!id) return true;

                // Otherwise, redirect it
                e.preventDefault();
                gwiki.getItemById(id[1]).then(function(response) {
                    gwiki.setExtraAttributes(response.result);
                    gwiki.setCurrentItem(response.result);
                })
            });

        // If it's not a google link, make sure it opens outside
        } else {
            links[i].target = "_blank";
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








GwikiUI.prototype.cleanHtml = function(html) {
    var st = html.indexOf('<body>');
    if (st > -1) html = html.substr(st+6);

    var end = html.indexOf('</body>');
    if (end > -1) html = html.substr(0, end);

    return html;
}

GwikiUI.prototype.getEmbedString = function(gwiki) {
    var i = gwiki.currentItem;
    if (i.mimeType == 'application/vnd.google-apps.document') return '<iframe class="google-doc" src="https://docs.google.com/document/d/'+i.id+'/preview">';
    else if (i.mimeType == 'application/vnd.google-apps.spreadsheet') return '<iframe class="google-doc" src="https://docs.google.com/spreadsheets/d/'+i.id+'/preview">';
    else return GwikiUI.strings['err-unknownembedtype'].replace('$type', i.mimeType);
}








// String library

GwikiUI.strings = {
    'title' : 'Gwiki',
    'prompt-homefolder' : 'Home Folder: ',
    'err-nocontent' : '<h1>No Content</h1><p>Sorry, it looks like this is an empty folder. You can add content to it by simply adding docs to it. Open the folder  <a href="https://drive.google.com/drive/folders/$id" target="_blank">here</a> to add some content.',
    'err-unknownembedtype' : '<h1>Unknown Type</h1><p>Sorry, I\'m not sure how to handle this document. You can register a handler for this document type by overriding the <code>Gwiki.prototype.getEmbedString</code> method, but be sure that if you do, you capture the previous method and call it, too, so you can be sure to handle all of the already-supported types.</p><p>The type you need to handle is $type.</p>'
}

