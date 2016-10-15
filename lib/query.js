'use strict';

let stream = require('stream')
let fs = require('fs')

let _ = require('lodash')
let minimist = require('minimist')
let shellquote = require('shell-quote')
let sqlite3 = require('sqlite3')

exports.pad = function(str) {
    return ('0' + str).slice(-2)
}

// not sure this is enough
exports.q = function(s) {
    return s.replace(/'/g, "''")
}

exports.conf = function(file) {
    if (!file) file = 'jekyllmk-fts.config.json'
    let r =  JSON.parse(fs.readFileSync(file))[process.env.NODE_ENV || 'production']
    r.log = (function() {
	if (r.verbose) {
	    let prefix = r.log_prefix || 'jekyllmk-fts'
	    return console.error.bind(console, `${prefix}:`)
	}
	return () => {}
    })()
    return r
}

exports.argv_parse = function(src) {
    if (!Array.isArray(src)) {
	src = shellquote.parse(src).map(val => {
	    if (typeof val === 'object' && val.op === 'glob') {
		return val.pattern
	    } else if (typeof val === 'object') {
		return null
	    }
	    return val
	}).filter( val => val)
    }

    let opt = {
	t: [],
	a: [],
    }
    let argv = minimist(src, {
	default: opt,
	string: ['t', 'a', 'd']
    })
    argv._ = argv._.join(' ').trim()
    // make sure all opt are arrays w/ uniq keys
    for (let key in opt) argv[key] = _.uniq([].concat(argv[key]))
    // for -d, the last one takes precedence
    if (Array.isArray(argv.d)) argv.d = argv.d[argv.d.length-1]

    return argv
}

// return [from, to] or null
exports.date_range_parse = function(s) {
    if (!s || s.match(/^\s*$/)) return null

    if (s.indexOf(',') === -1) s += ','
    let pair = s.split(',')
    if (pair.length !== 2) return null

    pair = pair.map( idx => {
	if (idx === '') return Date.now()
	return Date.parse(idx)
    })

    if (pair.some( idx => isNaN(idx))) return null
    if (pair[0] >= pair[1]) return null

    return pair
}

class DB {
    constructor(db_file) {
	this.db = new sqlite3.Database(db_file, sqlite3.OPEN_READONLY)
    }

    prepare(sql, args = []) {
	return new Promise( (resolve, reject) => {
	    let statement = this.db.prepare(sql, args, (err) => {
		if (err) {
		    reject(err)
		} else {
		    resolve(statement)
		}
	    })
	})
    }

    all(sql, args = []) {
	return new Promise( (resolve, reject) => {
	    this.db.all(sql, args, (err, rows) => {
		if (err) {
		    reject(err)
		} else {
		    resolve(rows)
		}
	    })
	})
    }
}

exports.DB = DB

exports.sql_generate = function(params, conf) {
    let prepare = [`SELECT DISTINCT
meta.id AS id, meta.year AS year, meta.month AS month, meta.day AS day, meta.name AS name, meta.subject AS subject, meta.authorslist AS authorslist, meta.tagslist AS tagslist, snippet(corpora) AS snippet
FROM meta
INNER JOIN corpora ON meta.id == corpora.id
WHERE`]

    if (params._ !== '') prepare.push(`body match '${exports.q(params._)}'`)

    if (params.d !== '') {
	let range = exports.date_range_parse(params.d)
	if (range) {
	    prepare.push(`(meta.created * 1000 >= ${range[0]} AND meta.created * 1000 <= ${range[1]})`)
	}
    }

    let tags_predicate = []
    params.t.forEach( val => {
	tags_predicate.push(`tag == '${exports.q(val)}'`)
    })
    if (tags_predicate.length) prepare.push('(' + tags_predicate.join(' OR ') + ')')

    let authors_predicate = []
    params.a.forEach( val => {
	authors_predicate.push(`author == '${exports.q(val)}'`)
    })
    if (authors_predicate.length) prepare.push('(' + authors_predicate.join(' OR ') + ')')

    if (prepare.length === 1) {
	throw new Error('nothing to search: no query params')
    }

    return prepare[0] + ' ' + prepare.slice(1).join(' AND ') + ` ORDER BY meta.id ${conf.sort} LIMIT ${conf.limit}`
}

exports.search = function(db, params, conf) {
    let rs = stream.Readable()
    let sql
    try {
	sql = exports.sql_generate(params, conf)
    } catch (err) {
	return Promise.reject(err)
    }
    conf.log(sql)

    return db.prepare(sql).then( statement => {
	rs._read = (size) => {
	    conf.log('consumer wants:', size)

	    statement.get( (err, row) => {
		if (err || row === undefined) {
		    statement.finalize()
		    if (err) {
			throw err
		    } else {
			rs.push(null)
		    }
		} else {
		    // application/x-json-stream
		    rs.push(JSON.stringify(row) + '\n')
		}
	    })
	}

	rs.on('error', err => {
	    throw err
	})

    }).then( () => {
	return rs
    })
}
