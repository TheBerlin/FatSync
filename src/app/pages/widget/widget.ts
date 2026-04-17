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
  settingsWeight = signal(75.5);
  settingsGoals = signal({ carbs: 250, fat: 70, protein: 150 });

  // Chart Properties
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
    elements: { line: { tension: 0.4 } },
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
      legend: { labels: { color: '#999', usePointStyle: true, pointStyle: 'circle' }, position: 'bottom' },
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
        this.settingsWeight.set(profile.weight || 75.5);

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
    const gridColor = isDark ? '#3a3a3a' : '#e9e9e7';
    const textColor = isDark ? '#999' : '#787774';
    const bgTooltip = isDark ? '#1a1a1a' : '#f7f7f5';
    const textTooltip = isDark ? '#fff' : '#37352f';

    this.lineChartOptions = {
        ...this.lineChartOptions,
        scales: {
            x: { ...this.lineChartOptions?.scales?.['x'], grid: { color: gridColor, drawTicks: false }, ticks: { color: textColor } },
            y: { ...this.lineChartOptions?.scales?.['y'], grid: { color: gridColor, drawTicks: false }, ticks: { color: textColor }, title: { color: textColor, text: 'Grams (g)', display: true } }
        },
        plugins: {
            ...this.lineChartOptions?.plugins,
            legend: { ...this.lineChartOptions?.plugins?.legend, labels: { color: textColor } },
            tooltip: { ...this.lineChartOptions?.plugins?.tooltip, backgroundColor: bgTooltip, titleColor: textTooltip, bodyColor: textTooltip, borderColor: gridColor }
        }
    };
    
    if (this.lineChartData.datasets) {
       (this.lineChartData.datasets[0] as any).borderColor = isDark ? '#60a5fa' : '#3b82f6';
       (this.lineChartData.datasets[1] as any).borderColor = isDark ? '#fb923c' : '#f97316';
       (this.lineChartData.datasets[2] as any).borderColor = isDark ? '#4ade80' : '#22c55e';
       this.lineChartData = { ...this.lineChartData };
    }
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
    this.userWeight.set(this.settingsWeight());
    this.view.set('main');
    // Persistence logic would go here
  }

  updateNow() {
    this.lastUpdated.set('just now');
    console.log('Syncing...');
  }

  // Template Helpers
  getIntakeValue(key: string): number {
    return (this.intake() as any)[key] || 0;
  }

  getPercentageValue(key: string): number {
    const val = (this.intake() as any)[key] || 0;
    const max = (this.targets() as any)[key] || 1;
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

  onTouchMove(e: TouchEvent) {
    // Prevent default scroll if needed, but usually fine
  }

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
