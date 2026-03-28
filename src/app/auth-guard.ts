import { CanActivateFn } from '@angular/router';
import { Supabase } from './services/supabase';
import { inject } from '@angular/core';
import { Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  return true;
};

// export const authGuard: CanActivateFn = async (route, state) => {
//   const supabase = inject(Supabase);
//   const router = inject(Router);

//   const { data } = await supabase.auth.getSession();
//   let session = data.session;

//   const hasTokenInUrl = window.location.hash.includes('access_token');

//   if (!session && hasTokenInUrl) {
//     await new Promise(resolve => setTimeout(resolve, 1000));
//     const secondCheck = await supabase.auth.getSession();
//     session = secondCheck.data.session;
//   }

//   if (session) {
//     return true;
//   } else {
//     router.navigate(['/login']);
//     return false;
//   }
// };
