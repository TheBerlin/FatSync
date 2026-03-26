import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class Supabase {
  private supabase: SupabaseClient;

  // Session state
  currentUser = signal<any>(null);
  
  constructor() {
    // Client initialization
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);

    // Session initialization
    this.initSession();
  }

  private async initSession() {
    // Check if user is already signed in
    const { data } = await this.supabase.auth.getSession();
    this.currentUser.set(data.session?.user ?? null);

    // Listen for auth state changes
    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser.set(session?.user ?? null);
    });
  }

  /**
   * Sign in with Google
   * @returns Supabase Auth response
   */
  async signInWithGoogle() {
    return await this.supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
  }

  /**
   * Get the Supabase Auth client
   * @returns Supabase Auth client
   */
  get auth() {
    return this.supabase.auth;
  }

  /**
   * Sign out of Supabase
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    }
  }
}
