GwikiUI = function(opts) {
    var t = this;
    Utils.merge(this, {
        defaultHome : false,
        config : {
            prettyUrls : false
        }
    }, opts || {});

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
    this.siteTitle.addEventListener('click', function(e) {
        e.preventDefault();
        t.gwiki.setCurrentItem(e.target.gobject);
    });

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


    // After the interface is built, block until GwikiBridge is initialized
    this.loading(true);
}

GwikiUI.prototype = Object.create(Object.prototype);
GwikiUI.interface = ['block','askForHome','drawStandardInterface'];



















// Interface Functions

GwikiUI.prototype.init = function() {
    var home,doc;

    // Initialized gwiki with bridge
    this.gwiki.init(this.bridge);

    // If we're using pretty urls,
    if (this.config.prettyUrls) {
        var path = window.location.pathname;
        
        // If a path is given,
        if (path != '/') {
            path = path.substr(1).split('/');

            // If the path has two parts,
            if (path.length == '2') {
                // Then set home and doc
                home = path[0];
                doc = path[1];

            // Otherwise, set doc if defaultHome was provided, otherwise set home
            } else {
                if (this.defaultHome) doc = path[0];
                else home = path[0]
            }
        }

    // Otherwise, use the query string to get params
    } else {
        if (!this.defaultHome) {
            home = window.location.search.match(/\bhome=([^&-]+)\b/);
            if (home) home = home[1];
        }
        doc = window.location.search.match(/\bdoc=([^&-]+)\b/);
        if (doc) doc = doc[1];
    }

    // If we have a default home, override
    if (this.defaultHome) home = this.defaultHome;

    if (!home) this.askForHome();
    else {
        // NOW WE HAVE A HOME AND POSSIBLY A DOC
        // WE ALSO HAVE A GWIKI WITH A BRIDGE
        // NEED TO SET THE HOME AND POSSIBLY ALSO SET THE DOC, THEN
        // LISTEN FOR COMPLETION OF THESE SO THAT WE CAN REBUILD THE FRAME
        // WHEN GWIKI IS READY
        this.rebuildFrame();
    }
}



// On first load or when resetting home
GwikiUI.prototype.askForHome = function() {
    var t = this;
    var str = '<form action="?" method="GET" class="homeForm"><label for="homeFolder">'+GwikiUI.strings['prompt-homefolder']+'<input type="text" id="homeFolder" value="'+(this.gwiki.home || '')+'" placeholder="e.g., https://drive.google.com/folders/2gja3lkaw3j-faoejsdlkalgalskdga"> <button type="submit">Ok</button></form>';
    var blocker = this.block(str);
    blocker.getElementsByTagName('form')[0].addEventListener('submit', function(e) {
        e.preventDefault();

        var folderId = document.getElementById("homeFolder").value;
        if (folderId.lastIndexOf('/') >= 0) folderId = folderId.substr(folderId.lastIndexOf('/')+1);
        var match = folderId.match(/[^a-zA-Z0-9_-]/);
        if (match) folderId = folderId.substr(0, match.index);

        t.loading(true);
        t.gwiki.setHome(folderId);
    });
}



// Rebuild essential elements of frame
GwikiUI.prototype.rebuildFrame = function() {
    var t = this;

    // Title
    document.title = this.gwiki.home.displayName;
    this.siteTitle.innerHTML = this.gwiki.home.displayName;
    this.siteTitle.gobject = this.gwiki.home;


    // Main Nav
    this.mainMenuContainer.innerHTML = '';
    this.mainMenu = [];

    for (var i = 0; i < this.gwiki.mainMenu.length; i++) {
        this.mainMenu[i] = document.createElement('a');
        this.mainMenu[i].href = "#"+this.gwiki.mainMenu[i].id;
        this.mainMenu[i].innerHTML = this.gwiki.mainMenu[i].displayName;
        this.mainMenu[i].setAttribute('data-gid', this.gwiki.mainMenu[i].id);
        this.mainMenu[i].gobject = this.gwiki.mainMenu[i];
        this.mainMenuContainer.appendChild(this.mainMenu[i]);

        // Click listener
        this.mainMenu[i].addEventListener('click', function(e) {
            e.preventDefault();
            t.gwiki.setCurrentItem(e.target.gobject);
        });
    }
}



// Rebuild the interface elements pertaining to "item"
GwikiUI.prototype.rebuildItemInterface = function() {
    var t = this;

    // If there's no current item selected, reset interface
    if (!this.gwiki.currentItem) {
        this.mainContent.innerHTML = GwikiUI.strings['errNoContent'].replace('$id', this.gwiki.parents[0].id);

    // Otherwise, set content
    } else {
        if (this.gwiki.currentItem.gwikiType == 'text/markdown') this.mainContent.innerHTML = this.parseMarkdown(this.gwiki.currentItem.body);
        else if (this.gwiki.currentItem.gwikiType == 'text/html') this.mainContent.innerHTML = this.cleanHtml(this.gwiki.currentItem.body);
        else {
            var str = this.getEmbedString();
            this.mainContent.innerHTML = this.getEmbedString();
        }
        this.parseContentLinks();
    }


    // Select main menu item
    var selectedMainItem = this.gwiki.parents[this.gwiki.parents.length-2];
    for (var i = 0; i < this.mainMenu.length; i++) {
        if (selectedMainItem && this.mainMenu[i].gobject.name == selectedMainItem.name) this.mainMenu[i].classList.add('selected');
        else this.mainMenu[i].classList.remove('selected');
    }


    // Create sub menu
    this.subMenu = [];
    this.subMenuContainer.innerHTML = '';
    if (this.gwiki.parents.length > 1) {
        for (var i = 0; i < this.gwiki.parents[0].children.length; i++) {
            this.subMenu[i] = document.createElement('a');
            this.subMenu[i].href = "#"+this.gwiki.parents[0].children[i].id;
            this.subMenu[i].innerHTML = this.gwiki.parents[0].children[i].displayName;
            this.subMenu[i].setAttribute('data-gid', this.gwiki.parents[0].children[i].id);
            this.subMenu[i].gobject = this.gwiki.parents[0].children[i];
            this.subMenuContainer.appendChild(this.subMenu[i]);

            // Click listener
            this.subMenu[i].addEventListener('click', function(e) {
                e.preventDefault();
                t.gwiki.setCurrentItem(e.target.gobject);
            });

            // If this looks like the group header, make it stand out
            if (this.gwiki.parents[0].displayName == this.gwiki.parents[0].children[i].displayName) this.subMenu[i].classList.add('gwiki-group-header');

            // If this one is selected, show that
            if (this.gwiki.currentItem && this.gwiki.parents[0].children[i].displayName == this.gwiki.currentItem.displayName) this.subMenu[i].classList.add('selected');
        }
    }
}



// Block the interface with an optional message or sub interface
GwikiUI.prototype.block = function(str) {
    if (!this.blocker) {
        this.blocker = document.createElement('div');
        this.blocker.className = 'blocker';
        this.root.appendChild(this.blocker);
    }

    this.blocker.innerHTML = '<div class="content">'+str+'</div>';
    return this.blocker;
}



// Unblock the interface
GwikiUI.prototype.unblock = function() {
    if (this.blocker) {
        this.blocker.parentElement.removeChild(this.blocker);
        this.blocker = null;
    }
}



// Loading
GwikiUI.prototype.loading = function(loading) {
    if (loading) this.block(GwikiUI.strings.displayTitle + GwikiUI.strings.tagline + GwikiUI.strings.loading);
    else this.unblock();
}













// Subscriptions

GwikiUI.prototype.subscribeGwikiListeners = function(gwiki) {
    var t = this;
    if (!Utils.implements(Gwiki.interface, gwiki)) throw "You must provide an instance of Gwiki as the argument to this function.";
    gwiki.addEventListener('error', function(e) { t.block(e.message); });
    gwiki.addEventListener('init', function(e) {
        t.gwiki = e.target;
        if (!t.initialized && t.ready) t.init();
    });
    gwiki.addEventListener('setHome', function(e) { t.init(); t.loading(false); });
    gwiki.addEventListener('setCurrentItem', function(e) { t.rebuildItemInterface(); t.loading(false); });
}

GwikiUI.prototype.subscribeGwikiBridgeListeners = function(bridge) {
    var t = this;
    if (!Utils.implements(GwikiBridge.interface, bridge)) throw "You must provide an instance of GwikiBridge as the argument to this function.";

    bridge.addEventListener('error', function(e) { t.block(e.message); });
    bridge.addEventListener('signinStatusChanged', function(e) {
        if (e.target.signedIn) {
            t.ready = true;
            t.unblock();
            if (t.gwiki) {
                if (!t.initialized) {
                    t.init();
                    if (t.gwiki.currentItem) t.rebuildItemInterface();
                    else if (t.gwiki.home) t.gwiki.setCurrentItem(t.gwiki.home);
                }
            } else {
                t.loading(true);
            }
        } else {
            t.ready = false;
            t.block(GwikiUI.strings.displayTitle + GwikiUI.strings.tagline + GwikiUI.strings.signinButton);
            
            // Load signin button
            var btn = t.blocker.getElementsByClassName('g-signin');
            if (btn.length == 0) return;
            btn = btn[0];
            btn.addEventListener('click', function(e) { t.loading(true); bridge.signin(); });
        }
    });
}









// Utility functions and extras

GwikiUI.prototype.cleanHtml = function(html) {
    var st = html.indexOf('<body>');
    if (st > -1) html = html.substr(st+6);

    var end = html.indexOf('</body>');
    if (end > -1) html = html.substr(0, end);

    return html;
}



GwikiUI.prototype.getEmbedString = function() {
    var i = this.gwiki.currentItem;
    if (i.mimeType == 'application/vnd.google-apps.document') return '<iframe class="google-doc" src="https://docs.google.com/document/d/'+i.id+'/preview">';
    else if (i.mimeType == 'application/vnd.google-apps.spreadsheet') return '<iframe class="google-doc" src="https://docs.google.com/spreadsheets/d/'+i.id+'/preview">';
    else return GwikiUI.strings['errUnknownEmbedType'].replace('$type', i.mimeType);
}



GwikiUI.prototype.parseMarkdown = function(md) {
    if (!(this.markdownParser instanceof Markdown.Converter)) {
        if (typeof this.markdownParser == 'function') this.markdownParser.call(this);
        else throw "this.markdownParser must be either an instance of Markdown.Converter or a container function that yields a Markdown.Converter";
    }
    return this.markdownParser.makeHtml(md);
}



GwikiUI.prototype.parseContentLinks = function() {
    var t = this;
    var links = this.mainContent.getElementsByTagName('a');
    for (var i = 0; i < links.length; i++) {
        // If we're instructed not to touch it, don't touch it
        if (links[i].classList.contains('gwiki-passthrough')) continue;

        // If this is a google drive link, try to load it on this page
        // TODO: Figure out how to fall back if this is not a page in this hierarchy
        if (links[i].href.match(/\.google\.com\/.+\/(d|folders)\/[a-zA-Z0-9._-]+/)) {
            links[i].addEventListener('click', function(e) {
                var id = e.target.href.match(/\.google\.com\/.+\/(d|folders)\/([a-zA-Z0-9._-]+)/);

                // If we can't figure it out, leave it
                if (!id) {
                    e.target.target = '_blank';
                    return true;
                }

                // Otherwise, redirect it
                e.preventDefault();
                t.gwiki.getItemById(id[2]).then(function(response) {
                    t.gwiki.setExtraAttributes(response.result);
                    t.gwiki.setCurrentItem(response.result);
                })
            });

        // If it's not a google link, make sure it opens outside
        } else {
            links[i].target = "_blank";
        }
    }
}





// String library

GwikiUI.strings = {
    'title' : 'Gwiki',
    'displayTitle' : '<h1>Gwiki</h1>',
    'tagline' : '<p>A wiki interface for Google Drive</p>',
    'loading' : '<p>Loading...</p>',
    'signinButton' : '<p><img class="g-signin" src="/assets/imgs/btn_google_signin_dark_normal_web.png"></p>',
    'signedOut' : '<p>You were signed out! Please sign in again.</p>',
    'prompt-homefolder' : 'Home Folder: ',

    'errNoContent' : '<h1>No Content</h1><p>Sorry, it looks like this is an empty folder. You can add content to it by simply adding docs to it. Open the folder  <a href="https://drive.google.com/drive/folders/$id" target="_blank">here</a> to add some content.',
    'errUnknownEmbedType' : '<h1>Unknown Type</h1><p>Sorry, I\'m not sure how to handle this document. You can register a handler for this document type by overriding the <code>Gwiki.prototype.getEmbedString</code> method, but be sure that if you do, you capture the previous method and call it, too, so you can be sure to handle all of the already-supported types.</p><p>The type you need to handle is $type.</p>'
}

