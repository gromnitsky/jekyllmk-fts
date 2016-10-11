#!/usr/bin/env node

/*
  Spit-out a SQL suitable for sqlite3.

  Usage: fts-sql.js path/to/index.json | sqlite3 -batch my-new-db.sqlite3
*/

let fs = require('fs')
let path = require('path')

let q = require('./lib/query').q

if (process.argv.length !== 3) {
    console.error(`Usage: fts-sql.js path/to/index.json`)
    process.exit(1)
}

let site_index = JSON.parse(fs.readFileSync(process.argv[2]))
let o = function(s) { console.log(s + ";\n") }

o('create table tags(id integer primary key, name)')
o('create table authors(id integer primary key, name)')

let tag_id = 0
site_index.tags.forEach( name => {
    o(`insert into tags values(${tag_id++}, '${q(name)}')`)
})
let author_id = 0
site_index.authors.forEach( name => {
    o(`insert into authors values(${author_id++}, '${q(name)}')`)
})

o('create table posts_tags(post_id, tag_id)')
o('create table posts_authors(post_id, author_id)')

// if {year, month, day} are all empty, it's a page, otherwise its' a
// regular post
o('create table posts(id integer primary key, year, month, day, name, subject)')
o('create virtual table corpora using fts4(id, body)')

// Posts
// FIXME: convert md to txt
let post_id = 0
site_index.posts.forEach( post => {
    let file = path.join(path.dirname(process.argv[2]),
			 post.y, post.m, post.d, post.n + '.md')
    o(`insert into posts values(${post_id}, ${post.y}, ${post.m}, ${post.d}, '${q(post.n)}', '${q(post.s)}')`)
    o(`insert into corpora values(${post_id}, readfile('${file}'))`)

    post.t.forEach( id => {
    	o(`insert into posts_tags values(${post_id}, ${id})`)
    })
    post.a.forEach( id => {
    	o(`insert into posts_authors values(${post_id}, ${id})`)
    })

    post_id++
})

// Pages don't have tags or authors associated w/ them.
site_index.pages.forEach( page => {
    let file = path.join(path.dirname(process.argv[2]),
			 'p', page.n + '.md')
    o(`insert into posts values(${post_id}, NULL, NULL, NULL, '${q(page.n)}', '${q(page.s)}')`)
    o(`insert into corpora values(${post_id}, readfile('${file}'))`)
    post_id++
})

// A view that includes `tags`, `authors`, `created` columns.
o(`CREATE VIEW _meta AS
SELECT
posts.id,
strftime('%s', date(printf('%s-%.2d-%.2d', posts.year, posts.month, posts.day))) as created,
posts.year,
posts.month,
posts.day,
posts.name,
posts.subject,
posts_authors.author_id,
authors.name AS author,
posts_tags.tag_id,
tags.name AS tag
FROM posts
LEFT JOIN posts_authors ON posts.id==posts_authors.post_id
LEFT JOIN authors ON posts_authors.author_id==authors.id
LEFT JOIN posts_tags ON posts.id==posts_tags.post_id
LEFT JOIN tags ON posts_tags.tag_id==tags.id`)

// A view that includes tags & authors as a comma separated string
o(`CREATE VIEW _metalists AS
SELECT
posts.id,
GROUP_CONCAT(authors.name) AS authorslist,
GROUP_CONCAT(tags.name) AS tagslist
FROM posts
LEFT JOIN posts_authors ON posts.id=posts_authors.post_id
LEFT JOIN authors ON posts_authors.author_id==authors.id
LEFT JOIN posts_tags ON posts.id==posts_tags.post_id
LEFT JOIN tags ON posts_tags.tag_id==tags.id GROUP BY posts.id`)

// A view for all user queries
o(`CREATE VIEW meta AS
SELECT _meta.*,_metalists.authorslist,_metalists.tagslist
FROM _meta INNER JOIN _metalists ON _meta.id==_metalists.id`)
