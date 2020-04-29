import "mocha";
import { assert } from "chai";
import { Gwiki, GwikiInterface } from "../src/Gwiki";
import { LogLevel } from "../src/Types";

describe("Gwiki", () => {
    it("should instantiate with or without options", () => {
        let gwiki: GwikiInterface;
        gwiki = new Gwiki();
        gwiki = new Gwiki({ logLevel: LogLevel.debug });
        assert(true, "Nothing really to test here. More just for typescript testing.");
    });


    it("should have readonly rootNode and currentNode", () => {
        const gwiki: GwikiInterface = new Gwiki();
        assert.equal(gwiki.rootNode, null, "Should be able to read rootNode");
        assert.equal(gwiki.currentNode, null, "Should be able to read currentNode");
        // Would like to test writing, but that's a typelevel thing, so our tests won't compile if we try
    });
});
