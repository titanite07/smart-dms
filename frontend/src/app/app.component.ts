import { Component } from '@angular/core';
import { RouterOutlet, ChildrenOutletContexts } from '@angular/router';
import { fadeAnimation } from './route-animations';
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    animations: [fadeAnimation]
})
export class AppComponent {
    title = 'dms-frontend';
    constructor(private contexts: ChildrenOutletContexts) { }
    getRouteAnimationData() {
        return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
    }
}
