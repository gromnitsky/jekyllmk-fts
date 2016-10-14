/* globals ng, Rx, JekyllmkFTS, JekyllmkFTSModule */
'use strict';

let app = {}

app.Main = ng.core.Component({
    selector: 'my-app',
    template: `
<h1>Main</h1>
<hr>
<router-outlet></router-outlet>
<hr>
`
}).Class({
    constructor:
    [ng.router.Router,
     function(router) {
	 this.router = router
	 console.log("app.Main")
    }],
})

app.Home = ng.core.Component({
    selector: 'home',
    template: `A Home Page
<a href="#/search/complex">of a search 1</a>,
<a href="#/search">and of a search 2</a>`
}).Class({
    constructor:
    [ng.router.Router,
     function(router) {
	 this.router = router
	 console.log("app.Home")
    }],
})

app.MainModule = ng.core.NgModule({
    imports: [
	ng.platformBrowser.BrowserModule,
	ng.http.HttpModule,
	ng.router.RouterModule.forRoot([
	    { path: '',  component: app.Home},
	    { path: 'search', loadChildren: 'fts-angular2.js#JekyllmkFTSModule'},
	    { path: 'search/:q', loadChildren: 'fts-angular2.js#JekyllmkFTSModule'},
	], { useHash: true }),
    ],
    declarations: [ app.Home, app.Main ],
    bootstrap: [ app.Main ]
}).Class({
    constructor: function() {},
})


let boot = function() {
    let config = 'config.json'
    fetch(config)
	.then( res => {
	    return res.json()
	}).then( json => {
	    // create a global config object
	    window.JekyllmkConfig = json
	    ng.platformBrowserDynamic.platformBrowserDynamic()
		.bootstrapModule(app.MainModule)
	}).catch( _err => {
	    document.body.innerHTML = `<h1>Failed to load ${config}</h1>`
	})
}

if (document.readyState === "loading")
    document.addEventListener('DOMContentLoaded', boot)
else
    boot()
