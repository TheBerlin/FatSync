import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { Supabase } from '../../services/supabase';
import { max } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  public supabase = inject(Supabase);

  notionConnected: boolean = true;
  fatSecretConnected: boolean = true;

  handleSync() {
    console.log('Syncing data...');
  }

  /**
   * Connect to FatSecret
   * Redirects to FatSecret authorization page
   */
  userProfile = this.supabase.userProfile;
  connectFatSecret() {
    const profile = this.userProfile();
    if (profile?.email) {
      const url = `/api/fs-authorize?email=${encodeURIComponent(profile.email)}`;
      window.open(url, '_blank');
    }
  }

  /**
   * Connect to Notion
   * Redirects to Notion authorization page
   */
  connectNotion() {
    const profile = this.userProfile();
    if (!profile?.email) return;

    this.isNotionLoading.set(true);
    this.startStatusPolling();

    const url = `/api/notion-authorize?email=${encodeURIComponent(profile.email)}`;
    window.open(url, '_blank');
  }

  /**
   * Copy embed link to clipboard
   */
  copyEmbedLink() {
    const url = `https://fetti-notion.vercel.app/embed/${this.userProfile()?.widget_token}`;
    navigator.clipboard.writeText(url);
  }

  /**
   * Handle window focus event
   * Reload user profile to update connection status
   */
  private checkStatusInterval: any;
  private startStatusPolling() {
    if (this.checkStatusInterval) clearInterval(this.checkStatusInterval);

    let attemps = 0;
    const maxAttemps = 10;

    this.checkStatusInterval = setInterval(async () => {
      attemps++;
      const userId = this.supabase.currentUser()?.id;

      if (userId) {
        const updatedProfile = (await this.supabase.getUserProfile(userId)) as any;
        if (updatedProfile?.notion_connected) this.stopLoading();
      }

      if (attemps >= maxAttemps) this.stopLoading();
    }, 2000);
  }

  isFatSecretLoading = signal(false);
  isNotionLoading = signal(false);
  private stopLoading() {
    this.isNotionLoading.set(false);
    if (this.checkStatusInterval) {
      clearInterval(this.checkStatusInterval);
      this.checkStatusInterval = null;
    }
  }

  ngOnDestroy() {
    this.stopLoading();
  }

  async disconnectNotion() {
    const userId = this.supabase.currentUser()?.id;
    if (!userId) return;

    if (!confirm('Disconnect Notion?')) return;

    const { error } = await this.supabase.updateProfile(userId, {
      notion_token: null,
      notion_db_id: null,
      notion_connected: false,
    });

    if (error) console.error('Error disconnecting Notion:', error);
    else console.log('Notion disconnected successfully');
  }
}
