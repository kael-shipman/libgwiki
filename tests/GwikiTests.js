QUnit.test('Can instantiate simply', function(assert) {
    var g = new Gwiki({
        persistence : false
    });

    assert.equal(g instanceof Gwiki, true, "g should be an instance of Gwiki");
    assert.equal(g.persistence, false, "Persistence should be turned off");
    assert.equal(g.parents.length, 0, "Parents should be an empty array");
});

