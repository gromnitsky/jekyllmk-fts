src := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: test
test:
	$(src)/node_modules/.bin/mocha -u tdd $(src)/test/test_*.js $(TEST_OPT)

.PHONY: server
server: kill compile
	$(src)/fts-server &

.PHONY: kill
kill:
	-pkill -f 'node $(src)/fts-server'


npm.root := $(shell npm -g root)

$(src)/dist/fts-angular2.js: $(src)/fts-angular2.js
	@mkdir -p $(dir $@)
	babel --presets $(npm.root)/babel-preset-es2015 $(BABEL_OPT) $< -o $@

.PHONY: compile
compile: $(src)/dist/fts-angular2.js
