import { CanActivateFn } from '@angular/router';
import { Supabase } from './services/supabase';
import { inject } from '@angular/core';
import { Router } from '@angular/router'; 

export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(Supabase);
  const router = inject(Router);

  // Check for the session
  let { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    await new Promise(resolve => setTimeout(resolve, 500));
    const secondCheck = await supabase.auth.getSession();
    session = secondCheck.data.session;
  }

  if (session) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
