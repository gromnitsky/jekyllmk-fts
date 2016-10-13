/* globals ng, Rx */
'use strict';

// Fetch a post
let JekyllmkFTSService = ng.core.Class({
    constructor: [ng.http.Http, function(http) {
	console.log('JekyllmkFTSService')
	this.http = http
    }],

    url: function(host, q) {
	return `${host}/?q=${q}`
    },

    xjson$: function(host, q) {
	// FIXME: pad month & day
	return this.http.get(this.url(host, q)).map(res => {
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
    [ng.router.Router, ng.router.ActivatedRoute, ng.common.Location, JekyllmkFTSService,
     function(router, activated_route, location, server) {
	 console.log("JekyllmkFTS")
	 this.location = location
	 this.server = server
	 this.error = null

	 this.first_time = true
	 // the callback runs every time route params change
	 activated_route.params.subscribe( data => {
	     this.query = data.q
	     this.on_submit()
	 })

	 this.result = []
    }],

    on_submit: function() {
	console.log("JekyllmkFTS: on_submit")

	this.server.xjson$('http://localhost:3000', this.query).toPromise()
	    .then(data => {
		this.error = null
		this.result = data
	    }).catch( err => {
		this.error = err.message || 'failed to load the results'
		console.log(err)
	    })

	if (!this.first_time)
	    this.location.replaceState(`/search/${this.query}`)
	this.first_time = false
    }
})

let JekyllmkFTSModule = ng.core.NgModule({
    imports: [
	ng.common.CommonModule,
	ng.forms.FormsModule,
	ng.router.RouterModule,
	ng.http.HttpModule,
    ],
    providers: [JekyllmkFTSService],
    declarations: [JekyllmkFTS],
}).Class({
    constructor: function() {},
})
