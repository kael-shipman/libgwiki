# Gwiki

*A simple single-page app that turns any google drive folder into a traversable wiki*

Google Drive is a fantastic solution for shared documents, and there's always a temptation to turn it into a wiki. Among its many other great qualities, it has a very well-built and highly granular permissions system that allows you to share very specific parts of document hierarchies with arbitrary people, even anonymous web users (this permissions system is one of its most attractive characteristics for me).

However, it doesn't work well as a wiki because each document opens its own tab with no shared navigation. This is awkward and frustrating, not to mention resource hungry as dozens of heavy tabs start laying around your browser.

So my solution was to use Google's API to string docs together into a navigable wiki, and here it is.

## Key Features

* Takes a parent folder and provides basic, hierarchical navigation for children and descendents;
* Renders docs via HTML export;
* Renders Markdown (and also plain text as markdown);
* Renders other types of google docs via iframe;
* Tries to parse links in docs to allow for in-hierarchy links to open in the app itself, rather than externally;

## Installation and Usage

While I'll be setting up Gwiki on a domain of its own for anyone to use at their liesure, you can also self-host it. If you choose to do that, here are the steps you'll need to follow:

1. Clone the repo to where you want it.
2. Run `composer install` (yes, I've used Composer even though this is a Javascript project because I just like it better than NPM).
3. Go to https://console.developers.google.com and create an OAuth client ID and an API key (use [this](https://developers.google.com/drive/v3/web/quickstart/js) for guidance if you need help).
4. Make sure to add your hostname to the client ID and API Key whitelists.
5. Finally, if you're using my default setup, you'll have to copy `src/config.local.js.template` to `src/config.local.js` and enter in your new credentials.
6. If you're not using my default setup, look at `examples/index.html` to see how I initialized everything. It's kind of a complicated process because of the way I built the app (see below for implementation details).

With that, you should be able to get it up and running.

## Tips and Tricks

* If you create a file with the same name as the folder that contains it, this becomes the submenu heading.
* You can add numeric prefixes for ordering that will be stripped out when page titles are displayed.
* You can add sufixes (like `.md`) that will also be stripped out. This can allow you to signal special mimeTypes without actually setting a special mimeType in Google Drive.


## Implementation Details

The actual implementation of Gwiki is somewhat of an experiment. I was enthralled by the idea of separation of concerns through event-driven architecture and decided to try to compose the app using three different sub-apps.

### The Gwiki State Container

The "engine", so to speak, is the `Gwiki` class. This is what can be considered the state container. When events happen on a UI (for example, "home folder changed" or "itemSelected"), `Gwiki` updates its state accordingly, throwing its own events out as its state transitions. The UI then catches these state update events and reads the state from Gwiki to render a current representation of the app for the user.

### The Gwiki Bridge

To maintain loose coupling between the app and the (rather poor) Google API client, I've implemented an adapter client called `GwikiBridge`. This class simply provides a few specific methods for accessing certain features of cloud storage, like signing in, getting an object by id, getting an object's children (if any), downloading an object's content, or exporting an object's content (i.e., converting to a different form). Theoretically, it would be possible to use a different `GwikiBridge` client to allow the app to run on a different kind of cloud storage, like DropBox, though no effort has been made to generalize the rest of the app for this scenario.

### The Gwiki UI

GwikiUI is actually where the bulk of the application logic happens. It's also the component that you will be most likely to modify or swap out if you want to change the look and feel of the application. If you're interested about what it does or how it works, you'll probably be better off just reading the source.

