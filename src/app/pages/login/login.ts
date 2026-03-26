import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-login',
  imports: [RouterLink],
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
private supabase = inject(Supabase);

  async handleLogin() {
    try {
      await this.supabase.signInWithGoogle();

    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  }
}
