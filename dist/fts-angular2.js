/* globals ng, JekyllmkConfig */
'use strict';

// Fetch a post

var JekyllmkFTSService = ng.core.Class({
		constructor: [ng.http.Http, function (http) {
				console.log('JekyllmkFTSService');
				if (typeof JekyllmkConfig === 'undefined') {
						throw new Error('JekyllmkFTSService requires a global JekyllmkConfig');
				}
				JekyllmkConfig.fts || (JekyllmkConfig.fts = 'http://localhost:3000');
				this.http = http;
		}],

		url: function url(q) {
				return JekyllmkConfig.fts + '/?q=' + q;
		},

		xjson$: function xjson$(q) {
				// FIXME: pad month & day
				return this.http.get(this.url(q)).map(function (res) {
						var r = res._body;
						return r.split("\n").filter(function (line) {
								return line.length;
						}).map(function (line) {
								var json = JSON.parse(line);
								if (json.year) {
										json._href = ['#', json.year, json.month, json.day, json.name].join('/') + '.md';
								} else {
										json._page = true;
										json._href = ['#', 'p', json.name].join('/') + '.md';
								}
								// FIXME: remove dups
								if (json.authorslist) json.authorslist = json.authorslist.split(',');
								if (json.tagslist) json.tagslist = json.tagslist.split(',');
								return json;
						});
				});
		}
});

var JekyllmkFTS = ng.core.Component({
		selector: 'search',
		template: '\n<h2>Full Text Search</h2>\n\n<form (ngSubmit)="on_submit()">\n  <p>\n  <label>\n  Usage: [-t tag] [-a author] [-d date1[,date2] query\n  <br>\n  <input type="text" spellCheck="false"\n   required [(ngModel)]="query" [ngModelOptions]="{standalone: true}">\n  </label>\n\n  <input type="submit">\n  </p>\n</form>\n\n<p *ngIf="error">\n  Error: {{ error }}\n</p>\n\n<p *ngIf="result.length == 0">\n  No match.\n</p>\n\n<p *ngIf="result.length != 0">\n  Matched: {{ result.length }} post(s).\n</p>\n\n<ul>\n  <li *ngFor="let post of result">\n    <p>\n    <span *ngIf="!post._page">\n    {{ post.year }}/{{ post.month }}/{{ post.day }}\n    </span>\n    <a href="{{post._href}}">{{ post.subject }}</a>\n\n    <span *ngIf="post.tagslist?.length">\n      &nbsp;&nbsp;\n      <span *ngFor="let val of post.tagslist">\n        <a [routerLink]="[\'/search\', \'-t \' + val]">{{ val }}</a>\n      </span>\n    </span>\n    <span *ngIf="post.authorslist?.length">\n      &nbsp;&nbsp;\n      <span *ngFor="let val of post.authorslist">\n        <a [routerLink]="[\'/search\', \'-a \' + val]">{{ val }}</a>\n      </span>\n    </span>\n\n    <span *ngIf="post.snippet">\n      <br>\n      {{ post.snippet }}\n    </span>\n    </p>\n  </li>\n</ul>\n'
}).Class({
		constructor: [ng.router.Router, ng.router.ActivatedRoute, ng.common.Location, ng.platformBrowser.Title, JekyllmkFTSService, function (router, activated_route, location, title, server) {
				var _this = this;

				console.log("JekyllmkFTS");
				this.location = location;
				this.title = title;
				this.server = server;

				this.error = null;
				// the callback runs every time route params change
				activated_route.params.subscribe(function (data) {
						_this.query = data.q;
						_this.on_submit();
				});

				this.result = [];
		}],

		on_submit: function on_submit() {
				var _this2 = this;

				console.log("JekyllmkFTS: on_submit");
				this.title.setTitle(JekyllmkConfig.title + ' :: FTS :: ' + this.query);
				if (!this.query) {
						this.error = 'the query is empty';
						return;
				}

				this.server.xjson$(this.query).toPromise().then(function (data) {
						_this2.error = null;
						_this2.result = data;
				}).catch(function (err) {
						_this2.error = 'failed to load the response from the database server at ' + JekyllmkConfig.fts;
						console.log(err);
				});

				this.location.replaceState('/search/' + this.query);
		}
});

var JekyllmkFTSModule = ng.core.NgModule({
		imports: [ng.common.CommonModule, ng.forms.FormsModule, ng.router.RouterModule.forChild([
		// FIXME: we should be able to specify our child routes
		// here, but in angular-2.0.2 + router-3.0.2 they are
		// ignored (w/ a lazy loading), thus we specify them in
		// the app's main module, where the bootstrap is done.
		{ path: '', component: JekyllmkFTS }], { useHash: true }), ng.http.HttpModule],
		providers: [JekyllmkFTSService],
		declarations: [JekyllmkFTS]
}).Class({
		constructor: function constructor() {}
});

// System.js looks here for the lazy loaded module name
exports.JekyllmkFTSModule = JekyllmkFTSModule;
