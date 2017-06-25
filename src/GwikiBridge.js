GwikiBridge = function(opts) {
    Utils.merge(this, {
        options : {
            initTimeout : 8,
            initCheckInterval : .5
        }
    }, opts);
    this.initTimer = 0;
}

GwikiBridge.prototype = Object.create(Object.prototype);
GwikiBridge.interface = [ 'init', 'signin' ];


// Add observable characteristics
Utils.makeObservable(GwikiBridge);


GwikiBridge.prototype.init = function(clientId, discoveryDocs, scope, apikey) {
    var t = this;

    // Make sure we've got gapi
    if (typeof gapi == 'undefined' || typeof gapi.client == 'undefined') {
        if (this.initTimer > initTimeout) {
            this.dispatchEvent('error', { type : 'initTimeout', message : GwikiBridge.strings['errInitTimeout'] });
            var err = "Waited "+this.initTimer+" seconds for Google's gapi object and it never showed up. "
                err += "The `init` method *should* be called when gapi successfully loads, so you may not be "
                err += "using it correctly. Read Google's [Quick Start Guide](https://developers.google.com/drive/v3/web/quickstart/js) "
                err += "for an example of how to succesfully load gapi.";
            throw err
        }
        this.initTimer = this.initTimer*1 + this.options.initCheckInterval*1;
        setTimeout(function() { t.init(clientId); }, this.options.initCheckInterval*1000);
        return;
    }


    // Initialize the google api
    if (apikey) gapi.client.setApiKey(apikey);
    gapi.client.init({
        clientId: clientId,
        discoveryDocs: discoveryDocs,
        scope: scope
    }).then(function () {
        // When the client is ready, create signinStatus event passthrough and notify initialized
        gapi.auth2.getAuthInstance().isSignedIn.listen(function (signedIn) {
            t.signedIn = signedIn
            t.dispatchEvent('signinStatusChanged');
        });
        t.signedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
        t.dispatchEvent('init');
        t.dispatchEvent('signinStatusChanged');
    });
}



// Signin
GwikiBridge.prototype.signin = function() {
    gapi.auth2.getAuthInstance().signIn();
}



// Get Items
GwikiBridge.prototype.getItemById = function(id, t) {
    var callback;
    if (!t) t = this;

    gapi.client.drive.files.get({
        'fileId' : id
    }).then(function(response) {
        var gwikiItemProps = response.result;
        t.dispatchEvent('getItem', { "gwikiItemProps" : gwikiItemProps });
        if (callback) callback.call(t, gwikiItemProps);
    });

    return { then : function(c) { callback = c; } };
}



// Get Children
GwikiBridge.prototype.getChildrenFor = function(gwikiItem, userParams, t) {
    var callback;
    var params = {
        'pageSize' : 1000,
        'fields' : 'files(id, name, mimeType)'
    };
    Utils.merge(params, userParams || {});
    if (!t) t = this;

    // Sanity check
    if (typeof gwikiItem == 'object') {
        if (!gwikiItem.id) throw "GwikiBridge::getChildFor must receive either an item id (string) or a GwikiItem with an `id` property as its argument. The object you've passed doesn't appear to have an `id` property set.";
        gwikiItem = gwikiItem.id;
    }
    params['q'] = "'"+gwikiItem+"' in parents and trashed = false",

    gapi.client.drive.files.list(params).then(function(response) {
        var children = response.result.files;
        t.dispatchEvent('getChildren', { "for" : gwikiItem, "children" : children });
        if (callback) callback.call(t, children);
    });

    return { then : function(c) { callback = c } };
}







// Strings
GwikiBridge.strings = {
    'errInitTimeout' : 'Sorry, something went wrong :(. Please reload the page to try again.'
}
