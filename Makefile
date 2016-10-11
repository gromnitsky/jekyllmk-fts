src := $(dir $(realpath $(lastword $(MAKEFILE_LIST))))

.PHONY: test
test:
	$(src)/node_modules/.bin/mocha -u tdd $(src)/test/test_*.js $(TEST_OPT)

.PHONY: server
server: kill
	$(src)/fts-server &

.PHONY: kill
kill:
	-pkill -f 'node $(src)/fts-server'
