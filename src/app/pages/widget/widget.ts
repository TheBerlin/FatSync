import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Supabase } from '../../services/supabase';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Sun01Icon, Settings02Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent],
  templateUrl: './widget.html',
  styleUrl: './widget.css',
})
export class Widget implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(Supabase);

  SunIcon = Sun01Icon;
  SettingsIcon = Settings02Icon;

  isLoading = signal(true);
  view = signal<'main' | 'settings' | 'stats'>('main');

  userData = signal<any>(null);
  goals = signal<any>(null);
  metrics = signal<any[]>([]);

  actualCalories = signal(1075);
  currentWeight = signal(0);

  async ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');

    if (token) {
      await this.loadAllData(token);
    }
  }

  async loadAllData(token: string) {
    this.isLoading.set(true);

    const { data: profile, error } = await this.supabase.getProfileByWidgetToken(token);

    if (profile) {
      this.userData.set(profile);
      this.currentWeight.set(profile.weight || 0);

      const [goalsRes, metricsRes] = await Promise.all([
        this.supabase.getUserGoals(profile.id),
        this.supabase.getDailyMetrics(profile.id),
      ]);

      if (goalsRes.data) this.goals.set(goalsRes.data);
      if (metricsRes.data) this.metrics.set(metricsRes.data);
    }

    this.isLoading.set(false);
  }

  toggleSettings() {
    this.view.set(this.view() === 'settings' ? 'main' : 'settings');
  }

  toggleStats() {
    this.view.set(this.view() === 'stats' ? 'main' : 'stats');
  }

  async syncWithFatSecret() {
    console.log('Syncing with FatSecret...');
  }

  /**
   * Save settings to database
   * @param newGoals New goals data
   * @returns Promise
   */
  async saveSettings(newGoals: any) {
    const userId = this.userData()?.id;
    if (!userId) return;

    const { error } = await this.supabase.updateUserSettings(userId, newGoals);

    if (!error) {
      this.goals.set(newGoals);
      this.view.set('main');
    } else {
      console.error('Ошибка сохранения:', error);
    }
  }

  private touchStart: number | null = null;
  private touchEnd: number | null = null;
  private readonly minSwipeDistance = 50;

  calculateOffset(value: number | undefined, max: number | undefined): number {
    const val = value || 0;
    const m = max || 1;
    const percentage = Math.min((val / m) * 100, 100);
    const circumference = 2 * Math.PI * 45;
    return circumference - (percentage / 100) * circumference;
  }

  calculatePercent(value: number | undefined, max: number | undefined): number {
    if (!max) return 0;
    return Math.round(Math.min(((value || 0) / max) * 100, 100));
  }

  onTouchStart(e: TouchEvent) {
    this.touchEnd = null;
    this.touchStart = e.targetTouches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEnd = e.changedTouches[0].clientX;
    if (!this.touchStart || !this.touchEnd) return;

    const distance = this.touchStart - this.touchEnd;
    const isLeftSwipe = distance > this.minSwipeDistance;
    const isRightSwipe = distance < -this.minSwipeDistance;

    if (isLeftSwipe) {
      this.view.set('stats');
    } else if (isRightSwipe) {
      this.view.set('main');
    }
  }
}
