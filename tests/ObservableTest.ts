import "mocha";
import { assert } from "chai";
import { Observable } from "../src/Observable";
import { ObservableInterface, EventProperties } from "../src/Types";

// Define a test class to make observable
class TestObject {
    public tracker: number;
    protected state: number;

    public constructor(state: number) {
        this.tracker = 0;
        this.state = state;
    }

    public trigger(eventName: string, params?: any): boolean {
        if (typeof params !== "undefined") {
            params.state = this.state;
        }
        return this.dispatchEvent(eventName, params);
    }

    protected dispatchEvent(eventName: string, params?: unknown): boolean { return true; }
}

interface ObservableTestObject extends TestObject, ObservableInterface { }

describe("Observable", () => {
    const ObservableTest = Observable(TestObject);

    it("should handle events", () => {
        const test = new ObservableTest(3);

        test.addEventListener("test", function(e) {
            assert(typeof e.data !== "undefined", "Data property should not be undefined");
            assert(typeof (e.data as any).state !== "undefined", "State property should be set");
            assert(typeof (e.data as any).test !== "undefined", "Test property should be set");
            assert.equal((e.data as any).state, 3);
            assert.equal((e.data as any).test, "yay!!");

            // Deduce that target is set correctly by testing runtime methods
            const targ = <ObservableTestObject>e.target;
            assert(typeof targ.addEventListener !== "undefined", "e.target should have public 'addEventListener' method");
            assert(typeof targ.removeEventListener !== "undefined", "e.target should have public 'removeEventListener' method");
            assert(typeof targ.trigger !== "undefined", "e.target should have public 'trigger' method");
        });

        test.trigger("test", { test: "yay!!" });
    });


    it("should successfully remove event listeners", () => {
        const test = new ObservableTest(33);
        assert.equal(test.tracker, 0, "Should have initialized tracker to 0");

        const listener = (e: EventProperties) => { (e.target as ObservableTestObject).tracker++; }
        test.addEventListener("test", listener);
        test.trigger("test");
        assert.equal(test.tracker, 1, "Event listener should have augmented tracker to 1");

        test.removeEventListener("test", listener);
        test.trigger("test");
        assert.equal(test.tracker, 1, "Event listener should have been removed, but tracker was still augmented");
    });


    it("should stop propagation when requested", () => {
        const test = new ObservableTest(4);

        assert.equal(test.tracker, 0, "Should have initialized tracker to 0");

        // Add and trigger an event listener to make sure it works right to being with
        test.addEventListener("test", function(e) {
            (e.target as ObservableTestObject).tracker++;
        });
        test.trigger("test");
        assert.equal(test.tracker, 1, "Should have augmented the tracker to 1");

        // Add another event listener that stops propagation
        test.addEventListener("test2", function(e) {
            (e.target as ObservableTestObject).tracker++;
            e.stopPropagation();
        });

        // And another that will never be fired
        test.addEventListener("test2", function(e) {
            (e.target as ObservableTestObject).tracker++;
        });

        // Now fire test2 and make sure tracker only goes up once
        test.trigger("test2");
        assert.equal(test.tracker, 2, "Tracker should only have been augmented once.");
    });


    it("should prevent default when requested", () => {
        const test = new ObservableTest(4);

        test.addEventListener("test", function(e) {
            (e.target as ObservableTestObject).tracker++;
            e.preventDefault();
        });
        assert(!test.trigger("test"), "Trigger should have return false");
    });
});
