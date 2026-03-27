import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Supabase } from '../../services/supabase';

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
    if (profile?.email)
      window.location.href = `/api/fs-authorize?email=${encodeURIComponent(profile.email)}`;
  }

  /**
   * Copy embed link to clipboard
   */
  copyEmbedLink() {
    const url = `https://fetti-notion.vercel.app/embed/${this.userProfile()?.widget_token}`;
    navigator.clipboard.writeText(url);
  }
}
