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

## How to Use It

While I'll be setting up Gwiki on a domain of its own for anyone to use at their liesure, you can also self host-it. If you choose to do that, you'll have to create a Google API key and client ID. Just follow the directions at https://developers.google.com/drive/v3/web/quickstart/js.

When you've got your ClientID in hand, just take a look at the `examples/index.html` file to see how to get it set up.

You only need readonly permissions for drive, but you can, of course, add whatever other permissions you want.

Once it's set up (or if you're just using the web version), just open the page, enter the URL of the folder you want to be the "homepage", and let hit "ok".

## Tips and Tricks

* If you create a file with the same name as the folder that contains it, this becomes the submenu heading.
* You can add numeric prefixes for ordering that will be stripped out when page titles are displayed.
* You can add sufixes (like `.md`) that will also be stripped out. This can allow you to signal special mimeTypes without actually setting a special mimeType in Google Drive.


