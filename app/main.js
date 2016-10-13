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

app.MainModule = ng.core.NgModule({
    imports: [
	ng.platformBrowser.BrowserModule,
	ng.http.HttpModule,
	ng.router.RouterModule.forRoot([
	    { path: 'search/:q', component: JekyllmkFTS},
	    { path: '',  component: JekyllmkFTS},
	], { useHash: true }),

	JekyllmkFTSModule
    ],
    declarations: [ app.Main ],
    bootstrap: [ app.Main ]
}).Class({
    constructor: function() {},
})


let boot = function() {
    ng.platformBrowserDynamic.platformBrowserDynamic()
	.bootstrapModule(app.MainModule)
}

if (document.readyState === "loading")
    document.addEventListener('DOMContentLoaded', boot)
else
    boot()
