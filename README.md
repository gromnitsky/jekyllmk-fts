# jekyllmk-fts

A full-text search module
for [jekyllmk](https://github.com/gromnitsky/jekyllmk) static blog
generator.

The repo includes both server-side & client-side parts.

## How it works

`fts-new` util reads `index.json` file from a generated (via jekyllmk)
blog & creates an sqlite database file. To search through this DB
(for quick testing) there is `fts` util.

~~~
$ ./fts-new ~/somewhere/example.com-out/production/site/index.json

$ file fts.sqlite3
fts.sqlite3: SQLite 3.x database

$ ./fts angular
2016/06/06/pEXhuW.md: Angular2 2.0.0-rc1: ag: untagged
...console in Chrome 51 red from the Angular errors.

If you're using Angular2 in...
2016/03/29/angular2-is-annoying.md: Angular2 is annoying: ag: untagged
...annoying

Because of this (https://github.com/angular/angular/issues/2753).

What I want--what...
~~~

To do the search over the network, start `fts-server`. It requires in
the current dir:

* `fts.sqlite3` file (see the above)
* `jekyllmk-fts.config.json` (copy an example from `test/data/ag`)

Then we can make the same request using curl:

~~~
$ curl -s http://127.0.0.1:3000?q=angular
{"id":30,"year":2016,"month":"06","day":"06","name":"pEXhuW","subject":"Angular2 2.0.0-rc1","authorslist":["ag"],"tagslist":["untagged"],"snippet":"<b>...</b>console in Chrome 51 red from the <b>Angular</b> errors.\n\nIf you're using Angular2 in<b>...</b>"}
{"id":4,"year":2016,"month":"03","day":"29","name":"angular2-is-annoying","subject":"Angular2 is annoying","authorslist":["ag"],"tagslist":["untagged"],"snippet":"<b>...</b>annoying\n\nBecause of this (https://github.com/<b>angular</b>/<b>angular</b>/issues/2753).\n\nWhat I want--what<b>...</b>"}
~~~


## Integration w/ jekyllmk

1. Copy `fts-angular2.js` to the directory w/ your blog sources
   (**not** to the jekyllmk's repo!).

2. Add to `config.json`:

		"fts": "http://my-fts-server.example.com"

That's all! After you regenerate the blog, the sidebar will have a
"Search" link.

A live example: http://sigwait.tk/blog/#/search (the blog is hosted on
a petty openwrt router but the FTS server is on Heroku).


## Bugs

* `fts-new` runs a gazillion of node processes concurrently--this can
  eat all your memory if the amount of .md files is too big.
* The client side is Angular2.


## License

MIT.
