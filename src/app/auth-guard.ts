import { CanActivateFn } from '@angular/router';
import { Supabase } from './services/supabase';
import { inject } from '@angular/core';
import { Router } from 'express';

export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(Supabase);
  const router = inject(Router);

  // Check for the session
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    return true;
  } else {
    router.navigate(['/login']);
    return false;
  }
};
