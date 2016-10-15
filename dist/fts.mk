# Requires an external target `compile` defined in the parent makefile
# and the variable NODE_ENV.

# SET THIS: the directory with jekyllmk-src repo
jekyllmk.fts.src := /home/alex/lib/software/example/node/jekyllmk-fts2

# the directory with compiled site
jekyllmk.fts.site := $(NODE_ENV)/site

fts.db := fts.sqlite3

$(jekyllmk.fts.site)/index.json: compile

$(fts.db): $(jekyllmk.fts.site)/index.json
	$(jekyllmk.fts.src)/fts-new $<

.PHONY: fts-db
fts-db: $(fts.db)

.PHONY: fts-sync
fts-sync: fts-db
	@echo FIXME
	exit 1
