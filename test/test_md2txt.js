let assert = require('assert')
let fs = require('fs')
let path = require('path')

let md2txt = require('../libexec/md2txt').md2txt

suite('md2txt', function() {
    setup(function() {
    })

    test('samples', function(done) {
//	this.timeout(5000)
	let files = fs.readdirSync(path.join(__dirname, 'data', 'md2txt'))
	    .filter( name => path.extname(name) === '.md')
	    .map( name => path.join(__dirname, 'data', 'md2txt', name))
	let promises = []
	files.forEach( src => {
	    let p = new Promise( (resolve, reject) => {
		fs.readFile(src, (err, data) => {
		    if (err) {
			reject(err)
			return
		    }
		    let txt = md2txt(data.toString())
		    fs.readFile(src.replace(/md$/, 'txt'), (err, data) => {
			if (err) {
			    reject(err)
			    return
			}
			assert.equal(txt, data.toString())
			resolve(true)
		    })
		})
	    })

	    promises.push(p)
	})

	Promise.all(promises).then( () => done())
    })

})
