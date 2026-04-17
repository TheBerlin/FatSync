import { Component, inject, OnInit, signal, HostBinding, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Supabase } from '../../services/supabase';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { 
  Sun01Icon, 
  Moon01Icon, 
  Settings01Icon, 
  Cancel01Icon,
  ArrowDown01Icon
} from '@hugeicons/core-free-icons';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, BaseChartDirective],
  templateUrl: './widget.html',
  styleUrls: ['./widget.css']
})
export class Widget implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(Supabase);

  // Icons for Template
  SunIcon = Sun01Icon;
  MoonIcon = Moon01Icon;
  SettingsIcon = Settings01Icon;
  CancelIcon = Cancel01Icon;
  ArrowIcon = ArrowDown01Icon;

  // View & Theme State
  isLoading = signal(true);
  view = signal<'main' | 'stats' | 'settings'>('main');
  theme = signal<'light' | 'dark'>('dark');

  @HostBinding('attr.data-theme') get hostTheme() {
    return this.theme();
  }

  // User Data Signals
  userWeight = signal<number>(75.5);
  intake = signal({ carbs: 105, fat: 35, protein: 85 });
  targets = signal({ carbs: 250, fat: 70, protein: 150 });
  lastUpdated = signal<string>('a moment ago');

  // Computed Values
  calories = computed(() => {
    const cur = (this.intake().carbs * 4) + (this.intake().fat * 9) + (this.intake().protein * 4);
    const tar = (this.targets().carbs * 4) + (this.targets().fat * 9) + (this.targets().protein * 4);
    return { current: Math.round(cur), target: Math.round(tar) };
  });

  // Settings Temp State
  settingsWeight = 75.5;
  settingsGoals = signal({ carbs: 250, fat: 70, protein: 150 });

  // Chart Properties
  public lineChartType: ChartType = 'line';
  public lineChartData: ChartConfiguration['data'] = {
    labels: ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'],
    datasets: [
      {
        data: [180, 220, 195, 210, 175, 230, 200],
        label: 'Carbs',
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#3b82f6',
      } as any,
      {
        data: [50, 45, 55, 60, 48, 52, 58],
        label: 'Fat',
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#f97316',
        pointBorderColor: '#f97316',
      } as any,
      {
        data: [120, 135, 110, 145, 128, 115, 140],
        label: 'Protein',
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#22c55e',
      } as any
    ]
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666', font: { size: 10 } },
        border: { display: false }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawTicks: false },
        ticks: { color: '#666', font: { size: 10 }, stepSize: 50 },
        border: { display: false }
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1c1c',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        padding: 8,
        usePointStyle: true,
      }
    }
  };

  constructor() {
    effect(() => {
      this.updateChartTheme(this.theme());
    });
  }

  async ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      await this.loadAllData(token);
    } else {
      this.isLoading.set(false);
    }
  }

  async loadAllData(token: string) {
    this.isLoading.set(true);
    try {
      const { data: profile } = await this.supabase.getProfileByWidgetToken(token);
      if (profile) {
        this.userWeight.set(profile.weight || 75.5);
        this.settingsWeight = profile.weight || 75.5;

        const [goalsRes, metricsRes] = await Promise.all([
          this.supabase.getUserGoals(profile.id),
          this.supabase.getDailyMetrics(profile.id),
        ]);

        if (goalsRes.data) {
          this.targets.set(goalsRes.data);
          this.settingsGoals.set({ ...goalsRes.data });
        }
        if (metricsRes.data && metricsRes.data.length > 0) {
          const m = metricsRes.data[0];
          this.intake.set({ carbs: m.carbs, fat: m.fat, protein: m.protein });
        }
      }
    } catch (e) {
      console.error('Error loading widget data:', e);
    }
    this.isLoading.set(false);
  }

  updateChartTheme(theme: string) {
    const isDark = theme === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    const textColor = isDark ? '#666' : '#999';

    if (this.lineChartOptions?.scales?.['x']) {
      (this.lineChartOptions.scales['x'] as any).ticks.color = textColor;
    }
    if (this.lineChartOptions?.scales?.['y']) {
      (this.lineChartOptions.scales['y'] as any).grid.color = gridColor;
      (this.lineChartOptions.scales['y'] as any).ticks.color = textColor;
    }
    
    if (this.lineChartData.datasets) {
       this.lineChartData.datasets[0].borderColor = isDark ? '#3b82f6' : '#2563eb';
       this.lineChartData.datasets[1].borderColor = isDark ? '#f97316' : '#ea580c';
       this.lineChartData.datasets[2].borderColor = isDark ? '#22c55e' : '#16a34a';
       
       // Force point colors to avoid type collision but ensure they are updated
       this.lineChartData.datasets.forEach((ds: any) => {
         ds.pointBackgroundColor = ds.borderColor;
         ds.pointBorderColor = ds.borderColor;
       });

       this.lineChartData = { ...this.lineChartData };
    }
    this.lineChartOptions = { ...this.lineChartOptions };
  }

  toggleTheme() {
    this.theme.update(t => t === 'light' ? 'dark' : 'light');
  }

  setPage(pageIndex: number) {
    if (pageIndex === 0) this.view.set('main');
    if (pageIndex === 1) {
      this.view.set('stats');
      this.timePeriod.set('week');
    }
  }

  async saveSettings() {
    this.targets.set({ ...this.settingsGoals() });
    this.userWeight.set(this.settingsWeight);
    this.view.set('main');
    // Persistence would call supabase.updateUserSettings here
  }

  updateNow() {
    this.lastUpdated.set('just now');
    // Live sync would go here
  }

  // Template Helpers
  getIntakeValue(key: 'carbs' | 'fat' | 'protein'): number {
    return this.intake()[key] || 0;
  }

  getPercentageValue(key: 'carbs' | 'fat' | 'protein'): number {
    const val = this.intake()[key] || 0;
    const max = this.targets()[key] || 1;
    return Math.min(Math.round((val / max) * 100), 100);
  }

  getAvg(index: number) {
    const data = this.lineChartData.datasets[index].data as number[];
    if (!data || !data.length) return 0;
    return Math.round(data.reduce((a, b) => a + (b || 0), 0) / data.length);
  }

  // Statistics Controls
  timePeriod = signal<'week'|'month'|'year'>('week');

  changeTimePeriod(event: Event) {
    const val = (event.target as HTMLSelectElement).value as any;
    this.timePeriod.set(val);
    this.updateStatsData(val);
  }

  updateStatsData(period: 'week'|'month'|'year') {
    if (period === 'year') {
      this.lineChartData.labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      this.lineChartData.datasets[0].data = [190, 210, 185, 205, 195, 220, 180, 200, 215, 190, 225, 195];
      this.lineChartData.datasets[1].data = [52, 48, 55, 50, 58, 45, 60, 52, 48, 55, 50, 58];
      this.lineChartData.datasets[2].data = [125, 135, 118, 130, 122, 140, 115, 128, 135, 120, 145, 125];
    } else if (period === 'month') {
        this.lineChartData.labels = Array.from({length: 30}, (_, i) => `Apr ${i+1}`);
        this.lineChartData.datasets[0].data = Array.from({length: 30}, () => 180 + Math.floor(Math.random() * 70));
        this.lineChartData.datasets[1].data = Array.from({length: 30}, () => 45 + Math.floor(Math.random() * 20));
        this.lineChartData.datasets[2].data = Array.from({length: 30}, () => 110 + Math.floor(Math.random() * 50));
    } else {
        this.lineChartData.labels = ['Apr 11', 'Apr 12', 'Apr 13', 'Apr 14', 'Apr 15', 'Apr 16', 'Apr 17'];
        this.lineChartData.datasets[0].data = [180, 220, 195, 210, 175, 230, 200];
        this.lineChartData.datasets[1].data = [50, 45, 55, 60, 48, 52, 58];
        this.lineChartData.datasets[2].data = [120, 135, 110, 145, 128, 115, 140];
    }
    this.lineChartData = { ...this.lineChartData };
  }

  // Swipe Gestures
  private touchStartPos: number | null = null;
  private readonly minSwipeDistance = 50;

  onTouchStart(e: TouchEvent) {
    this.touchStartPos = e.touches[0].clientX;
  }

  onTouchMove(e: TouchEvent) { }

  onTouchEnd(e: TouchEvent) {
    if (!this.touchStartPos) return;
    const touchEndPos = e.changedTouches[0].clientX;
    const distance = this.touchStartPos - touchEndPos;
    
    if (Math.abs(distance) > this.minSwipeDistance) {
      if (distance > 0) { // Swipe Left
        if (this.view() === 'main') this.setPage(1);
      } else { // Swipe Right
        if (this.view() === 'stats') this.setPage(0);
      }
    }
    this.touchStartPos = null;
  }
}
