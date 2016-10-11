'use strict';

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

exports.argv_parse = function(src) {
    if (!Array.isArray(src))
	src = shellquote.parse(src).filter(val => typeof val !== 'object')

    let opt = {
	t: [],
	a: [],
    }
    let argv = minimist(src, {
	default: opt,
	string: ['d']
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
