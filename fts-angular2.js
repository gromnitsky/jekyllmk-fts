/* globals ng, JekyllmkConfig */
'use strict';

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
	// FIXME: pad month & day
	return this.http.get(this.url(q)).map(res => {
	    let r = res._body
	    return r.split("\n").filter( line => line.length).map( line => {
		let json = JSON.parse(line)
		if (json.year) {
		    json._href = ['#', json.year, json.month, json.day, json.name].join('/') + '.md'
		} else {
		    json._page = true
		    json._href = ['#', 'p', json.name].join('/') + '.md'
		}
		// FIXME: remove dups
		if (json.authorslist) json.authorslist = json.authorslist.split(',')
		if (json.tagslist) json.tagslist = json.tagslist.split(',')
		return json
	    })
	})
    }
})

let JekyllmkFTS = ng.core.Component({
    selector: 'search',
    template: `
<h2>Full Text Search</h2>

<form (ngSubmit)="on_submit()">
  <p>
  <label>
  Usage: [-t tag] [-a author] [-d date1[,date2] query
  <br>
  <input type="text" spellCheck="false"
   required [(ngModel)]="query" [ngModelOptions]="{standalone: true}">
  </label>

  <input type="submit">
  </p>
</form>

<p *ngIf="error">
  Error: {{ error }}
</p>

<p *ngIf="result.length == 0">
  No match.
</p>

<p *ngIf="result.length != 0">
  Matched: {{ result.length }} post(s).
</p>

<ul>
  <li *ngFor="let post of result">
    <p>
    <span *ngIf="!post._page">
    {{ post.year }}/{{ post.month }}/{{ post.day }}
    </span>
    <a href="{{post._href}}">{{ post.subject }}</a>

    <span *ngIf="post.tagslist?.length">
      &nbsp;&nbsp;
      <span *ngFor="let val of post.tagslist">
        <a [routerLink]="['/search', '-t ' + val]">{{ val }}</a>
      </span>
    </span>
    <span *ngIf="post.authorslist?.length">
      &nbsp;&nbsp;
      <span *ngFor="let val of post.authorslist">
        <a [routerLink]="['/search', '-a ' + val]">{{ val }}</a>
      </span>
    </span>

    <span *ngIf="post.snippet">
      <br>
      {{ post.snippet }}
    </span>
    </p>
  </li>
</ul>
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
     }],

    on_submit: function() {
	console.log("JekyllmkFTS: on_submit")
	this.title.setTitle(`${JekyllmkConfig.title} :: FTS :: ${this.query}`)
	if (!this.query) {
	    this.error = 'the query is empty'
	    return
	}

	this.server.xjson$(this.query).toPromise()
	    .then( data => {
		this.error = null
		this.result = data
	    }).catch( err => {
		this.error = `failed to load the response from the database server at ${JekyllmkConfig.fts}`
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
