let assert = require('assert')

let query = require('../lib/query')

suite('Query', function() {
    setup(function() {
    })

    test('date_range_parse', function() {
	assert.equal(null, query.date_range_parse())
	assert.equal(null, query.date_range_parse('a,b,c'))
	assert.equal(null, query.date_range_parse('a'))
	assert.equal(null, query.date_range_parse('a,b'))
	assert.equal(null, query.date_range_parse('2017,2016'))
	assert.equal(null, query.date_range_parse('2016,2016'))

	assert(query.date_range_parse('2016'))
	assert.deepEqual([1451606400000, 1483228800000],
			 query.date_range_parse('2016,2017'))
	assert.deepEqual([1470009600000, 1476057600000],
			 query.date_range_parse('2016-08-01,2016-10-10'))
    })

})
