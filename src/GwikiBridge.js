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


GwikiBridge.prototype.init = function(clientId, discoveryDocs, scope) {
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
    });
}



// Signin
GwikiBridge.prototype.signin = function() {
    gapi.auth2.getAuthInstance().signIn();
}







// Strings
GwikiBridge.strings = {
    'errInitTimeout' : 'Sorry, something went wrong :(. Please reload the page to try again.'
}
