import {
    trigger,
    transition,
    style,
    query,
    group,
    animate,
} from '@angular/animations';
export const fadeAnimation = trigger('routeAnimations', [
    transition('* <=> *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
            style({
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
            })
        ], { optional: true }),
        query(':enter', [
            style({
                opacity: 0,
                transform: 'scale(0.98) translateY(10px)',
                filter: 'blur(4px)'
            })
        ], { optional: true }),
        group([
            query(':leave', [
                animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({
                    opacity: 0,
                    transform: 'scale(1.02) translateY(-10px)',
                    filter: 'blur(4px)'
                }))
            ], { optional: true }),
            query(':enter', [
                animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({
                    opacity: 1,
                    transform: 'scale(1) translateY(0)',
                    filter: 'blur(0)'
                }))
            ], { optional: true }),
        ]),
    ]),
]);
