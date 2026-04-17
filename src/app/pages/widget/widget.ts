import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Supabase } from '../../services/supabase';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Sun01Icon, Settings02Icon } from '@hugeicons/core-free-icons';

// Если у тебя есть компоненты для кружков и графиков, импортируй их тут
// import { MacroCircleComponent } from './components/macro-circle';

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

  // Иконки
  SunIcon = Sun01Icon;
  SettingsIcon = Settings02Icon;

  // Состояния (Signals)
  isLoading = signal(true);
  view = signal<'main' | 'settings' | 'stats'>('main'); // Переключатель экранов

  // Данные пользователя
  userData = signal<any>(null);
  goals = signal<any>(null);
  metrics = signal<any[]>([]);

  // Текущие показатели (для примера пока статика, потом привяжешь к FatSecret)
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

    // 1. Находим пользователя по токену
    const { data: profile, error } = await this.supabase.getProfileByWidgetToken(token);

    if (profile) {
      this.userData.set(profile);
      this.currentWeight.set(profile.weight || 0);

      // 2. Параллельно загружаем цели и статистику
      const [goalsRes, metricsRes] = await Promise.all([
        this.supabase.getUserGoals(profile.id),
        this.supabase.getDailyMetrics(profile.id),
      ]);

      if (goalsRes.data) this.goals.set(goalsRes.data);
      if (metricsRes.data) this.metrics.set(metricsRes.data);
    }

    this.isLoading.set(false);
  }

  // Методы управления
  toggleSettings() {
    this.view.set(this.view() === 'settings' ? 'main' : 'settings');
  }

  toggleStats() {
    this.view.set(this.view() === 'stats' ? 'main' : 'stats');
  }

  async syncWithFatSecret() {
    // Здесь будет вызов твоего API для синхронизации
    console.log('Syncing with FatSecret...');
    // После синхронизации вызываем loadAllData снова
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
      this.goals.set(newGoals); // Обновляем локальное состояние
      this.view.set('main'); // Возвращаемся на главный экран
    } else {
      console.error('Ошибка сохранения:', error);
    }
  }
}
