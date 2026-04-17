import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'embed/:token', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
