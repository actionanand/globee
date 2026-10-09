import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'explore',
    loadComponent: () =>
      import('./features/explore/explore.component').then((m) => m.ExploreComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'explore' },
  { path: '**', redirectTo: 'explore' },
];
