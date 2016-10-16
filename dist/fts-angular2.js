/* globals ng, JekyllmkConfig */
'use strict';

/*
  This module is loaded by systemjs on demand. We don't need to weap
  it into a function, for systemjs does it automatically.
*/

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
    return this.http.get(this.url(q)).map(function (res) {
      var r = res._body;
      return r.split("\n").filter(function (line) {
        return line.length;
      }).map(function (line) {
        var json = JSON.parse(line);
        if (json.year) {
          json._href = ['#', json.year, json.month, json.day, json.name].join('/');
        } else {
          json._href = ['#', 'p', json.name].join('/');
        }
        return json;
      });
    });
  }
});

var JekyllmkFTS = ng.core.Component({
  selector: 'search',
  styles: ['\ntd {\n  vertical-align: top;\n  padding: 0 .7em;\n  word-break: break-all;\n}\ntd:first-child {\n  padding-left: .3em;\n  width: 70%;\n  word-break: break-word;\n}\ntr:nth-child(even) {\n  background-color: #fafafa;\n}\nform div {\n  display: flex;\n}\nform div input[type="text"] {\n  flex-grow: 1;\n  margin-right: .5em;\n}\nform a:first-child {\n  display: inline-block;\n  margin-bottom: .3em;\n}\n\n#jekyllmk_fts--spinner {\n  border: 0.5em solid blue;\n  border-radius: 50%;\n  border-top: 0.5em solid gold;\n  width: 32px;\n  height: 32px;\n  animation: jekyllmk_fts--spin 1s linear infinite;\n\n  margin-left: auto;\n  margin-right: auto;\n  margin-top: 1em;\n}\n@keyframes jekyllmk_fts--spin {\n  0% { transform: rotate(0deg); }\n  100% { transform: rotate(360deg); }\n}\n'],
  template: '\n<h2>Full Text Search</h2>\n\n<form (ngSubmit)="on_submit()">\n  <a href="javascript:void(0)"\n     (click)="help_toggle()">{{ help_anchor_text }}</a><br>\n  <label [hidden]="!help" for="jekyllmk_fts--input">\n    Usage: [-t tag] [-a author] [-d date1[,date2] <i>query</i><br>\n    <i>Query</i> expression is a <a href="https://www.sqlite.org/fts3.html#full_text_index_queries">sqlite3 full-text index</a> DSL. The search result is\n(usually) auto-limited to 10 rows.<br>\n    Examples:<br>\n    <pre>\n\t-d 2016,2017 spain\n\t-d 2016-01-01,2016-12-12 -a ag -t quote  spain</pre>\n  </label>\n\n  <div>\n  <input type="text" spellCheck="false" id="jekyllmk_fts--input"\n   required [(ngModel)]="query" [ngModelOptions]="{standalone: true}">\n  <input type="submit">\n  </div>\n</form>\n\n<div *ngIf="in_progress" id="jekyllmk_fts--spinner"></div>\n\n<p *ngIf="error">\n  <b>{{ error }}</b>\n</p>\n\n<p *ngIf="result.length == 0 && !error && !in_progress">\n  No match.\n</p>\n\n<p *ngIf="result.length != 0">\n  Matched: {{ result.length }} post(s).\n</p>\n\n<table>\n<tbody>\n<tr *ngFor="let post of result">\n\n<td>\n  <a href="{{post._href}}">{{ post.subject }}</a><br>\n  <span *ngIf="post.year">\n    {{ post.year }}/{{ post.month }}/{{ post.day }}\n  </span>\n\n  <p *ngIf="post.snippet" [innerHTML]="post.snippet"></p>\n</td>\n\n<td>\n  <span *ngIf="post.tagslist?.length">\n    <span *ngFor="let val of post.tagslist">\n      <a [routerLink]="[\'/search\', \'-t \' + val]">{{ val }}</a>\n    </span>\n  </span>\n</td>\n\n<td>\n  <span *ngIf="post.authorslist?.length">\n    <span *ngFor="let val of post.authorslist">\n      <a [routerLink]="[\'/search\', \'-a \' + val]">{{ val }}</a>\n    </span>\n  </span>\n</td>\n\n</tr>\n</tbody>\n</table>\n'
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
    this.help = false;
    this.help_anchor_text = 'Help';
    this.in_progress = false;
  }],

  help_toggle: function help_toggle() {
    this.help = !this.help;
    this.help_anchor_text = this.help ? 'Hide' : 'Help';
  },

  on_submit: function on_submit() {
    var _this2 = this;

    console.log("JekyllmkFTS: on_submit");
    this.title.setTitle(JekyllmkConfig.title + ' :: FTS :: ' + this.query);
    if (!this.query) {
      this.error = 'The query is empty.';
      return;
    }

    this.in_progress = true;
    this.error = null;
    this.server.xjson$(this.query).toPromise().then(function (data) {
      _this2.in_progress = false;
      _this2.result = data;
    }).catch(function (err) {
      _this2.in_progress = false;
      _this2.result = [];
      _this2.error = err.statusText ? err.statusText : 'Failed to load the response from the database server at ' + JekyllmkConfig.fts + '.';
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
