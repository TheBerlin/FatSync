import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Supabase } from '../../services/supabase';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Sun01Icon, Settings02Icon, Cancel01Icon } from '@hugeicons/core-free-icons';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule, HugeiconsIconComponent, BaseChartDirective],
  templateUrl: './widget.html',
})
export class Widget implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(Supabase);

  SunIcon = Sun01Icon;
  SettingsIcon = Settings02Icon;
  CancelIcon = Cancel01Icon;

  isLoading = signal(true);
  view = signal<'main' | 'settings' | 'stats'>('main');

  userData = signal<any>(null);
  goals = signal<any>({ carbs: 250, fat: 70, protein: 150 });
  metrics = signal<any[]>([]);

  actualCalories = signal(1075);
  currentWeight = signal(70);

  // Settings Temp State
  settingsWeight = signal(70);
  settingsCarbs = signal(250);
  settingsFat = signal(70);
  settingsProtein = signal(150);

  // Chart
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
    datasets: [
      {
        data: [180, 220, 195, 210, 175, 230, 200],
        label: 'Carbs',
        borderColor: '#60a5fa',
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#60a5fa',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
      },
      {
        data: [50, 45, 55, 60, 48, 52, 58],
        label: 'Fat',
        borderColor: '#fb923c',
        pointBackgroundColor: '#fb923c',
        pointBorderColor: '#fb923c',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
      },
      {
        data: [120, 135, 110, 145, 128, 115, 140],
        label: 'Protein',
        borderColor: '#4ade80',
        pointBackgroundColor: '#4ade80',
        pointBorderColor: '#4ade80',
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 4,
      }
    ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
      line: { tension: 0.4 }
    },
    scales: {
      x: {
        grid: { color: '#3a3a3a', drawTicks: false },
        ticks: { color: '#999', font: { size: 12 } },
        border: { display: false }
      },
      y: {
        grid: { color: '#3a3a3a', drawTicks: false },
        ticks: { color: '#999', font: { size: 12 } },
        border: { display: false },
        title: { display: true, text: 'Grams (g)', color: '#999', font: { size: 12 } }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#999', usePointStyle: true, pointStyle: 'circle' },
        position: 'bottom',
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3a3a3a',
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
      }
    }
  };

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
      this.currentWeight.set(profile.weight || 70);

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
    if (this.view() !== 'settings') {
      this.settingsWeight.set(this.currentWeight());
      this.settingsCarbs.set(this.goals()?.carbs || 250);
      this.settingsFat.set(this.goals()?.fat || 70);
      this.settingsProtein.set(this.goals()?.protein || 150);
      this.view.set('settings');
    } else {
      this.view.set('main');
    }
  }

  closeSettings() {
    this.view.set('main');
  }

  async syncWithFatSecret() {
    console.log('Syncing with FatSecret...');
  }

  async saveSettings() {
    const newGoals = {
      carbs: this.settingsCarbs(),
      fat: this.settingsFat(),
      protein: this.settingsProtein()
    };
    const newWeight = this.settingsWeight();

    const userId = this.userData()?.id;
    if (userId) {
      this.supabase.updateUserSettings(userId, newGoals);
      // Let's assume updating weight is handled smoothly for now
    }
    
    this.goals.set(newGoals);
    this.currentWeight.set(newWeight);
    this.view.set('main');
  }

  changeSettingsValue(field: 'weight'|'carbs'|'fat'|'protein', event: Event) {
    const val = (event.target as HTMLInputElement).value;
    const num = parseFloat(val) || 0;
    if (field === 'weight') this.settingsWeight.set(num);
    if (field === 'carbs') this.settingsCarbs.set(num);
    if (field === 'fat') this.settingsFat.set(num);
    if (field === 'protein') this.settingsProtein.set(num);
  }

  setPage(pageIndex: number) {
    if (pageIndex === 0) this.view.set('main');
    if (pageIndex === 1) this.view.set('stats');
  }

  private touchStart: number | null = null;
  private touchEnd: number | null = null;
  private readonly minSwipeDistance = 50;

  getMetrics() {
    const activeMetrics = this.metrics()?.length ? this.metrics()[0] : { carbs: 105, fat: 35, protein: 85 };
    return activeMetrics;
  }

  calculateOffset(value: number | undefined, max: number | undefined): number {
    const val = value || 0;
    const m = max || 1;
    const percentage = Math.min((val / m) * 100, 100);
    const radius = 54; // size=120, r=(120-12)/2 = 54
    const circumference = 2 * Math.PI * radius;
    return circumference - (percentage / 100) * circumference;
  }

  getCircumference(): number {
    return 2 * Math.PI * 54;
  }

  calculatePercent(value: number | undefined, max: number | undefined): number {
    if (!max || max === 0) return 0;
    return Math.round(Math.min(((value || 0) / max) * 100, 100));
  }

  onTouchStart(e: TouchEvent) {
    if (this.view() === 'settings') return;
    this.touchEnd = null;
    this.touchStart = e.targetTouches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    if (this.view() === 'settings') return;
    this.touchEnd = e.changedTouches[0].clientX;
    if (!this.touchStart || !this.touchEnd) return;

    const distance = this.touchStart - this.touchEnd;
    const isLeftSwipe = distance > this.minSwipeDistance;
    const isRightSwipe = distance < -this.minSwipeDistance;

    if (isLeftSwipe && this.view() === 'main') {
      this.view.set('stats');
    } else if (isRightSwipe && this.view() === 'stats') {
      this.view.set('main');
    }
  }
}
