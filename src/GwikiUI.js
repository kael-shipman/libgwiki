GwikiUI = function(opts) {
    Utils.merge(this, {
        options : {
            rootId : 'gwiki-ui'
        }
    }, opts || {});

    // Make initial UI
    this.root = document.getElementById(this.options.rootId);
    this.root.appendChild(document.createElement('header'));
    this.header = this.root.lastChild;
    this.header.className = 'gwiki-header';
    this.root.appendChild(document.createElement('section'));
    this.main = this.root.lastChild;
    this.main.className = 'gwiki-main';
    this.root.appendChild(document.createElement('footer'));
    this.footer = this.root.lastChild;
    this.footer.className = 'gwiki-footer';
}

GwikiUI.prototype = Object.create(Object.prototype);
GwikiUI.interface = ['block','askForHome','drawStandardInterface'];

GwikiUI.prototype.checkForGwiki = function() {
    if (!Utils.implements(Gwiki.interface, this.gwiki)) throw "You must provide an instance of Gwiki as the `gwiki` property of a `GwikiUI`";
}

GwikiUI.prototype.block = function(str) {
    var blocker = document.createElement('div');
    blocker.className = 'blocker';
    blocker.innerHTML = '<div class="content">'+str+'</div>';
    document.body.appendChild(blocker);
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
GwikiUI.prototype.askForHome = function() {
    this.checkForGwiki();
    var str = '<form action="?" method="GET" class="homeForm"><label for="homeFolder">Home Folder: <input type="text" id="homeFolder" value="'+(this.gwiki.home || '')+'" placeholder="e.g., https://drive.google.com/folders/2gja3lkaw3j-faoejsdlkalgalskdga"> <button type="submit">Ok</button></form>';
    var blocker = this.block(str);
    var gwikiUI = this;
    blocker.getElementsByTagName('form')[0].addEventListener('submit', function(e) {
        e.preventDefault();

        var folderId = document.getElementById("homeFolder").value;
        if (folderId.lastIndexOf('/') >= 0) folderId = folderId.substr(folderId.lastIndexOf('/')+1);
        var match = folderId.match(/[^a-zA-Z0-9_-]/);
        if (match) folderId = folderId.substr(0, match.index);

        gwikiUI.gwiki.setHome(folderId);
    });
}








// On load any page
GwikiUI.prototype.drawStandardInterface = function() {
    var body = document.getElementById('gwiki-ui');
}






GwikiUI.prototype.setMainContent = function(content) {
    if (typeof content == 'string') this.main.innerHTML = content;
    else {
        this.main.innerHTML = '';
        this.main.appendChild(content);
    }
}









// String library

GwikiUI.strings = {
    'title' : 'Gwiki'
}

