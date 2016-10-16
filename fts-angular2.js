/* globals ng, JekyllmkConfig */
'use strict';

/*
  This module is loaded by systemjs on demand. We don't need to weap
  it into a function, for systemjs does it automatically.
*/

// Fetch a post
let JekyllmkFTSService = ng.core.Class({
    constructor: [ng.http.Http, function(http) {
	console.log('JekyllmkFTSService')
	if (typeof JekyllmkConfig === 'undefined') {
	    throw new Error('JekyllmkFTSService requires a global JekyllmkConfig')
	}
	JekyllmkConfig.fts || (JekyllmkConfig.fts = 'http://localhost:3000');
	this.http = http
    }],

    url: function(q) {
	return `${JekyllmkConfig.fts}/?q=${q}`
    },

    xjson$: function(q) {
	return this.http.get(this.url(q)).map(res => {
	    let r = res._body
	    return r.split("\n").filter( line => line.length).map( line => {
		let json = JSON.parse(line)
		if (json.year) {
		    json._href = ['#', json.year, json.month, json.day, json.name].join('/')
		} else {
		    json._href = ['#', 'p', json.name].join('/')
		}
		return json
	    })
	})
    }
})

let JekyllmkFTS = ng.core.Component({
    selector: 'search',
    styles: [`
td {
  vertical-align: top;
  padding: 0 .7em;
  word-break: break-all;
}
td:first-child {
  padding-left: .3em;
  width: 70%;
  word-break: break-word;
}
tr:nth-child(even) {
  background-color: #fafafa;
}
form div {
  display: flex;
}
form div input[type="text"] {
  flex-grow: 1;
  margin-right: .5em;
}
form a:first-child {
  display: inline-block;
  margin-bottom: .3em;
}
`],
    template: `
<h2>Full Text Search</h2>

<form (ngSubmit)="on_submit()">
  <a href="javascript:void(0)"
     (click)="help_toggle()">{{ help_anchor_text }}</a><br>
  <label [hidden]="!help" for="jekyllmk_fts--input">
    Usage: [-t tag] [-a author] [-d date1[,date2] <i>query</i><br>
    <i>Query</i> expression is a <a href="https://www.sqlite.org/fts3.html#full_text_index_queries">sqlite3 full-text index</a> DSL. The search result is
(usually) auto-limited to 10 rows.<br>
    Examples:<br>
    <pre>
	-d 2016,2017 spain
	-d 2016-01-01,2016-12-12 -a ag -t quote  spain</pre>
  </label>

  <div>
  <input type="text" spellCheck="false" id="jekyllmk_fts--input"
   required [(ngModel)]="query" [ngModelOptions]="{standalone: true}">
  <input type="submit">
  </div>
</form>

<p *ngIf="error">
  <b>{{ error }}</b>
</p>

<p *ngIf="result.length == 0">
  No match.
</p>

<p *ngIf="result.length != 0">
  Matched: {{ result.length }} post(s).
</p>

<table>
<tbody>
<tr *ngFor="let post of result">

<td>
  <a href="{{post._href}}">{{ post.subject }}</a><br>
  <span *ngIf="post.year">
    {{ post.year }}/{{ post.month }}/{{ post.day }}
  </span>

  <p *ngIf="post.snippet" [innerHTML]="post.snippet"></p>
</td>

<td>
  <span *ngIf="post.tagslist?.length">
    <span *ngFor="let val of post.tagslist">
      <a [routerLink]="['/search', '-t ' + val]">{{ val }}</a>
    </span>
  </span>
</td>

<td>
  <span *ngIf="post.authorslist?.length">
    <span *ngFor="let val of post.authorslist">
      <a [routerLink]="['/search', '-a ' + val]">{{ val }}</a>
    </span>
  </span>
</td>

</tr>
</tbody>
</table>
`
}).Class({
    constructor:
    [ng.router.Router, ng.router.ActivatedRoute, ng.common.Location,
     ng.platformBrowser.Title,
     JekyllmkFTSService,
     function(router, activated_route, location, title, server) {
	 console.log("JekyllmkFTS")
	 this.location = location
	 this.title = title
	 this.server = server

	 this.error = null
	 // the callback runs every time route params change
	 activated_route.params.subscribe( data => {
	     this.query = data.q
	     this.on_submit()
	 })

	 this.result = []
	 this.help = false
	 this.help_anchor_text = 'Help'
     }],

    help_toggle: function() {
	this.help = !this.help
	this.help_anchor_text = this.help ? 'Hide' : 'Help'
    },

    on_submit: function() {
	console.log("JekyllmkFTS: on_submit")
	this.title.setTitle(`${JekyllmkConfig.title} :: FTS :: ${this.query}`)
	if (!this.query) {
	    this.error = 'The query is empty.'
	    return
	}

	this.server.xjson$(this.query).toPromise()
	    .then( data => {
		this.error = null
		this.result = data
	    }).catch( err => {
		this.result = []
		this.error = err.statusText ? err.statusText : `Failed to load the response from the database server at ${JekyllmkConfig.fts}.`
		console.log(err)
	    })

	this.location.replaceState(`/search/${this.query}`)
    }
})

let JekyllmkFTSModule = ng.core.NgModule({
    imports: [
	ng.common.CommonModule,
	ng.forms.FormsModule,
	ng.router.RouterModule.forChild([
	    // FIXME: we should be able to specify our child routes
	    // here, but in angular-2.0.2 + router-3.0.2 they are
	    // ignored (w/ a lazy loading), thus we specify them in
	    // the app's main module, where the bootstrap is done.
	    { path: '', component: JekyllmkFTS},
	], { useHash: true }),
	ng.http.HttpModule,
    ],
    providers: [JekyllmkFTSService],
    declarations: [JekyllmkFTS],
}).Class({
    constructor: function() {},
})

// System.js looks here for the lazy loaded module name
exports.JekyllmkFTSModule = JekyllmkFTSModule
