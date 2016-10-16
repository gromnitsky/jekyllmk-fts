let assert = require('assert')
let fs = require('fs')
let path = require('path')

let md2txt = require('../libexec/md2txt').md2txt

suite('md2txt', function() {
    setup(function() {
    })

    test('samples', function(done) {
	let files = fs.readdirSync(path.join(__dirname, 'data', 'md2txt'))
	    .filter( name => path.extname(name) === '.md')
	    .map( name => path.join(__dirname, 'data', 'md2txt', name))
	files.forEach( src => {
	    fs.readFile(src, (err, data) => {
		if (err) throw err;
		let txt = md2txt(data.toString())
		fs.readFile(src.replace(/md$/, 'txt'), (err, data) => {
		    assert.equal(txt, data.toString())
		    done()
		})
	    })
	})
    })
})
