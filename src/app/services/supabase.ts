import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  private supabase: SupabaseClient;

  // Session state
  currentUser = signal<any>(null);

  constructor(private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    this.initSession();
  }

  /**
   * Initialize session
   * Check if user is already signed in
   * Listen for auth state changes
   */
  private async initSession() {
    const { data } = await this.supabase.auth.getSession();
    this.handleAuthState(data.session);

    this.supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') this.handleAuthState(session);
      else if (_event === 'SIGNED_OUT') this.handleAuthState(null);
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
        redirectTo: `${window.location.origin}/dashboard`,
      },
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
    this.router.navigate(['/']);
    if (error) console.error('Error signing out:', error.message);
  }

  /**
   * Get user profile
   * If profile doesn't exist, create it
   * @returns User profile
   */
  userProfile = signal<any>(null);
  async getUserProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await this.supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            email: this.currentUser()?.email,
            is_premium: true,
            fs_connected: false,
            notion_connected: false,
            widget_token: crypto.randomUUID(),
          },
        ])
        .select()
        .single();

      if (!insertError) {
        this.userProfile.set(newProfile);
        return newProfile;
      }

      return null;
    } else if (!error) {
      this.userProfile.set(data);
      return data;
    }
    return null;
  }

  /**
   * Handle auth state change
   * @param session Supabase auth session
   */
  private async handleAuthState(session: any) {
    const user = session?.user ?? null;
    this.currentUser.set(user);

    if (user) await this.getUserProfile(user.id);
    else this.userProfile.set(null);
  }

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (!error && data) this.userProfile.set(data);

    return { data, error };
  }

  async getProfileByWidgetToken(token: string) {
    return await this.supabase.from('profiles').select('*').eq('widget_token', token).single();
  }

  async getUserGoals(userId: string) {
    return await this.supabase.from('goals').select('*').eq('user_id', userId).single();
  }

  async getDailyMetrics(userId: string) {
    return await this.supabase
      .from('daily_metrics')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(30); // Get data for the last 30 days
  }

  async updateUserSettings(userId: string, goals: any) {
    return await this.supabase.from('user_goals').upsert(
      {
        user_id: userId,
        target_calories: goals.target_calories,
        target_protein: goals.target_protein,
        target_fat: goals.target_fat,
        target_carbs: goals.target_carbs,
        updated_at: new Date(),
      },
      { onConflict: 'user_id' },
    );
  }
}
