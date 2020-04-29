The Gwiki Library
=============================================================================

The Gwiki Library is a library for turning a cloud provider (originally Google Drive, but technically could be any cloud-based filesystem) into a traversable wiki. It provides a set of abstractions that allow you to interact with the desired cloud provider as if it were a wiki, leaving the consumption of its state up to you, the creator of a user interface for it.

Gwiki's concept of a "wiki" includes the following details:

* A wiki has a home. This is the folder that defines the top-level navigation and the beginning of the path history.
* Each node on the tree descending from "home" may have it's own content (i.e., each section can have a "homepage").
* Every node on the tree has a "next" node and a "previous" node, either of which may be null.

The library defines several interfaces that facilitate this structure, and provides a default implementation for Google Drive.


## API

Following are the interfaces that Gwiki provides and a description of what they do:

### `Gwiki`

The base object. This maintains a connection to the underlying provider (Google Drive, Dropbox, etc...) and provides information about current state.

#### Properties and Methods

##### `rootNode: GwikiNode`

Gets or sets the current root node (homepage) for the wiki. When getting root node, returns either null or `GwikiNode`. When setting, accepts null, `GwikiNode`, or a string `id`, which it converts to a `GwikiNode`. Also sets the current node if current node is null.

Emits a `home-changed` event when new home data is fully loaded.

##### `currentNode: GwikiNode`

Gets or sets the current node. When getting current node, returns either null or `GwikiNode`. When setting, accepts null, `GwikiNode`, or a string `id`, which it converts to a `GwikiNode`.

Emits a `current-node-changed` event when new node data is fully loaded.

##### `connectionState: int` (readonly)

Returns the current connection state. Connection states may be one of the following:

* -2 : Connection unsuccessful
* -1 : Invalid app credentials
*  0 : Not connected (i.e., no attempt has been made to log in yet)
*  1 : Attempting to connect
*  2 : Connected

##### `connectionObstructions: string[]` (readonly)

An array (possibly empty) of strings describing connection issues.

##### `connect(): boolean`

Uses provider implementation's API to initiate a connection (login), returning whether or not the attempt to initiate was successful. (Note, a successful initiation does not imply a successful connection.)

Emits various `connection-state-changed` events as the connection state changes.

##### `disconnect(): boolean`

Uses provider implementation's API to disconnect (i.e., log out), returning whether or not the attempt was successful.


### `GwikiNode`

An object representing a node. Note that it is possible for valid nodes to exist outside the current wiki tree. You can choose whether or not to display these nodes.

#### Properties and Methods

##### `id: string` (readonly)

The id of the node as determined by the provider.

##### `sourceUrl: string` (readonly)

The url where the original node can be found at the provider (e.g., https://drive.google.com/?id=aaaabbbbccccddddeeeee1111222333444)

##### `title: string` (readonly)

Returns the title of the node. This is derived from the underlying filename, which has certain characters stripped (usually file extensions and numeric prefixes).

##### `nodeType: string` (readonly)

`folder` if this is an internal node (a folder), or `doc` if it's a leaf/external node (a document).

##### `mimeType: string` (readonly)

The mime type as reported by the provider.

##### `async getPreviousNode(): null|GwikiNode`

Returns null or the previous node (`Gwikinode`), which may be a simple sibling of the node on which this is called or may be the final leaf node of the previous subtree.

##### `async getNextNode(): null|GwikiNode `

Returns null or the next node (`GwikiNode`), which may be a simple sibling of the node on which this is called or may be the first leaf node of the next subtree.

##### `async hasAncestor(node: GwikiNode|id): boolean`

Returns true if `node` is an ancestor of the node on which this is called.

##### `async hasDescendent(node: GwikiNode|id): boolean`

Returns true if `node` is a descendent of the node on which this is called.

