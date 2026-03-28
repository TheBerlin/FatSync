import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
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

  isNotionLoading = signal(false);
  isFatSecretLoading = signal(false);
  @HostListener('window:focus', [])
  async onWindowFocus() {
    // Если анимация запущена и мы вернулись в окно
    if (this.isNotionLoading()) {
      const userId = this.supabase.currentUser()?.id;
      if (userId) {
        // Ждем секунду, чтобы бэкенд успел сохранить токены
        setTimeout(async () => {
          await this.supabase.getUserProfile(userId);
          this.isNotionLoading.set(false); // Выключаем только здесь!
        }, 1000);
      } else {
        // Если что-то пошло не так, всё равно выключаем лоадер через время
        this.isNotionLoading.set(false);
      }
    }
  }
}
