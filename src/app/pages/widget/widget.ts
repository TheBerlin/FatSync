import {
  Component,
  inject,
  OnInit,
  signal,
  HostBinding,
  effect,
  computed,
  HostListener,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Supabase } from '../../services/supabase';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  Sun02Icon,
  Moon02Icon,
  Settings01Icon,
  Cancel01Icon,
  ArrowDown01Icon,
} from '@hugeicons/core-free-icons';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, HugeiconsIconComponent, BaseChartDirective],
  templateUrl: './widget.html',
  styleUrls: ['./widget.css'],
})
export class Widget implements OnInit {
  private route = inject(ActivatedRoute);
  private supabase = inject(Supabase);
  private el = inject(ElementRef);

  // Icons for Template
  SunIcon = Sun02Icon;
  MoonIcon = Moon02Icon;
  SettingsIcon = Settings01Icon;
  CancelIcon = Cancel01Icon;
  ArrowIcon = ArrowDown01Icon;

  // View & Theme State
  isLoading = signal(true);
  view = signal<'main' | 'stats' | 'settings' | 'breakdown'>('main');
  theme = signal<'light' | 'dark' | 'amoled' | 'nord' | 'dracula' | 'solarized-dark' | 'solarized-light' | 'catppuccin' | 'gruvbox' | 'tokyo-night' | 'sunset' | 'ocean' | 'forest'>('dark');
  userTier = signal<'basic' | 'premium' | 'pro'>('pro'); // Mock tier state

  @HostBinding('attr.data-theme') get hostTheme() {
    return this.theme();
  }

  // User Data Signals
  userWeight = signal<number>(0);
  intake = signal({ carbs: 0, fat: 0, protein: 0 });
  intakeAnimated = signal({ carbs: 0, fat: 0, protein: 0 }); // For number counter animation
  intakeCircleAnimated = signal({ carbs: 0, fat: 0, protein: 0 }); // For circle fill animation
  targets = signal({ carbs: 250, fat: 70, protein: 150 });
  lastUpdated = signal<string>('');
  isUpdating = signal(false);
  userId = signal<string>(''); // Store user ID for updates

  // Computed Values
  calories = computed(() => {
    const cur = this.intake().carbs * 4 + this.intake().fat * 9 + this.intake().protein * 4;
    const tar = this.targets().carbs * 4 + this.targets().fat * 9 + this.targets().protein * 4;
    return { current: Math.round(cur), target: Math.round(tar) };
  });

  // Settings Temp State
  settingsGoals = signal({ carbs: 250, fat: 70, protein: 150 });
  settingsTheme = signal<'light' | 'dark' | 'amoled' | 'nord' | 'dracula' | 'solarized-dark' | 'solarized-light' | 'catppuccin' | 'gruvbox' | 'tokyo-night' | 'sunset' | 'ocean' | 'forest'>('dark');
  isThemeDropdownOpen = signal(false);

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
      } as any,
    ],
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    elements: { line: { tension: 0.4 } },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#666', font: { size: 10 } },
        border: { display: false },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)', drawTicks: false },
        ticks: { color: '#666', font: { size: 10 }, stepSize: 50 },
        border: { display: false },
      },
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
      },
    },
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

    // Reset animated values to 0 before starting animation
    this.intakeAnimated.set({ carbs: 0, fat: 0, protein: 0 });
    this.intakeCircleAnimated.set({ carbs: 0, fat: 0, protein: 0 });

    // Animate numbers and circles independently
    this.animateNumbers();
    this.animateCircles();
  }

  async loadAllData(token: string) {
    this.isLoading.set(true);
    try {
      const { data: profile } = await this.supabase.getProfileByWidgetToken(token);
      if (profile) {
        this.userId.set(profile.id);
        this.userWeight.set(profile.weight || 0);

        const [goalsRes, metricsRes] = await Promise.all([
          this.supabase.getUserGoals(profile.id),
          this.supabase.getDailyMetrics(profile.id),
        ]);

        // Load goals/targets
        if (goalsRes.data) {
          this.targets.set({
            carbs: goalsRes.data.target_carbs || 250,
            fat: goalsRes.data.target_fat || 70,
            protein: goalsRes.data.target_protein || 150
          });
          this.settingsGoals.set({ ...this.targets() });
        }

        // Load today's metrics
        if (metricsRes.data && metricsRes.data.length > 0) {
          const today = metricsRes.data[0];
          this.intake.set({
            carbs: today.actual_carbs || 0,
            fat: today.actual_fat || 0,
            protein: today.actual_protein || 0
          });

          // Set last updated time
          if (today.updated_at) {
            const updatedDate = new Date(today.updated_at);
            const now = new Date();
            const diffMinutes = Math.floor((now.getTime() - updatedDate.getTime()) / 60000);

            if (diffMinutes < 1) {
              this.lastUpdated.set('moment ago');
            } else if (diffMinutes < 60) {
              this.lastUpdated.set(`${diffMinutes}m ago`);
            } else {
              const hours = Math.floor(diffMinutes / 60);
              this.lastUpdated.set(`${hours}h ago`);
            }
          }

          // Load chart data for stats page
          this.loadChartData(metricsRes.data);
        } else {
          this.lastUpdated.set('no data yet');
        }

        // Update last sync from profile
        if (profile.last_sync) {
          const syncDate = new Date(profile.last_sync);
          const now = new Date();
          const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / 60000);

          if (diffMinutes < 1) {
            this.lastUpdated.set('moment ago');
          } else if (diffMinutes < 60) {
            this.lastUpdated.set(`${diffMinutes}m ago`);
          } else {
            const hours = Math.floor(diffMinutes / 60);
            this.lastUpdated.set(`${hours}h ago`);
          }
        }
      }
    } catch (e) {
      console.error('Error loading widget data:', e);
      this.lastUpdated.set('error loading data');
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
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  onThemeChange() {
    // Theme is already updated via ngModel, just trigger chart update
    this.updateChartTheme(this.theme());
  }

  toggleThemeDropdown() {
    this.isThemeDropdownOpen.update((v) => !v);
  }

  selectTheme(theme: 'light' | 'dark' | 'amoled' | 'nord' | 'dracula' | 'solarized-dark' | 'solarized-light' | 'catppuccin' | 'gruvbox' | 'tokyo-night' | 'sunset' | 'ocean' | 'forest') {
    this.settingsTheme.set(theme);
    this.isThemeDropdownOpen.set(false);
  }

  getThemeLabel(): string {
    const labels: Record<string, string> = {
      'light': 'Light',
      'dark': 'Dark',
      'amoled': 'AMOLED Black',
      'nord': 'Nord',
      'dracula': 'Dracula',
      'solarized-dark': 'Solarized Dark',
      'solarized-light': 'Solarized Light',
      'catppuccin': 'Catppuccin',
      'gruvbox': 'Gruvbox',
      'tokyo-night': 'Tokyo Night',
      'sunset': 'Sunset',
      'ocean': 'Ocean',
      'forest': 'Forest'
    };
    return labels[this.settingsTheme()] || 'Dark';
  }

  setPage(pageIndex: number) {
    if (pageIndex === 0) this.view.set('main');
    if (pageIndex === 1) {
      this.view.set('stats');
      this.timePeriod.set('week');
    }
  }

  openSettings() {
    // Initialize settings with current values
    this.settingsTheme.set(this.theme());
    this.view.set('settings');
  }

  async saveSettings() {
    const userId = this.userId();
    if (!userId) return;

    // Update targets in Supabase
    await this.supabase.updateUserSettings(userId, {
      target_carbs: this.settingsGoals().carbs,
      target_fat: this.settingsGoals().fat,
      target_protein: this.settingsGoals().protein,
    });

    // Apply theme change
    this.theme.set(this.settingsTheme());

    // Update local state
    this.targets.set({ ...this.settingsGoals() });
    this.view.set('main');
  }

  async updateNow() {
    if (this.isUpdating()) return;
    const userId = this.userId();
    if (!userId) return;

    this.isUpdating.set(true);

    // Auto-reset after 10 seconds
    const timeoutId = setTimeout(() => {
      this.isUpdating.set(false);
    }, 10000);

    try {
      // Trigger sync for this user
      const response = await fetch('/api/sync-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        // Reload data after sync
        const token = this.route.snapshot.paramMap.get('token');
        if (token) {
          await this.loadAllData(token);
        }
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      clearTimeout(timeoutId);
      this.isUpdating.set(false);
    }
  }

  // Load chart data from metrics
  loadChartData(metrics: any[]) {
    if (!metrics || metrics.length === 0) return;

    // Take last 7 days for week view
    const last7Days = metrics.slice(0, 7).reverse();

    this.lineChartData.labels = last7Days.map(m => {
      const date = new Date(m.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    this.lineChartData.datasets[0].data = last7Days.map(m => m.actual_carbs || 0);
    this.lineChartData.datasets[1].data = last7Days.map(m => m.actual_fat || 0);
    this.lineChartData.datasets[2].data = last7Days.map(m => m.actual_protein || 0);

    this.lineChartData = { ...this.lineChartData };
  }

  // Template Helpers
  getIntakeValue(key: 'carbs' | 'fat' | 'protein'): number {
    return this.intakeAnimated()[key] || 0;
  }

  getPercentageValue(key: 'carbs' | 'fat' | 'protein'): number {
    const val = this.intakeCircleAnimated()[key] || 0;
    const max = this.targets()[key] || 1;
    return Math.min(Math.round((val / max) * 100), 100);
  }

  animateNumbers() {
    const duration = 800; // 0.8 seconds - faster for numbers
    const steps = 50;
    const interval = duration / steps;

    const targetIntake = this.intake();
    let currentStep = 0;

    const easeOutQuad = (t: number) => t * (2 - t);

    const animate = () => {
      currentStep++;
      const progress = easeOutQuad(currentStep / steps);

      this.intakeAnimated.set({
        carbs: Math.round(targetIntake.carbs * progress),
        fat: Math.round(targetIntake.fat * progress),
        protein: Math.round(targetIntake.protein * progress)
      });

      if (currentStep < steps) {
        setTimeout(animate, interval);
      } else {
        this.intakeAnimated.set(targetIntake);
      }
    };

    animate();
  }

  animateCircles() {
    const duration = 1200; // 1.2 seconds
    const fps = 60;
    const totalFrames = (duration / 1000) * fps;
    let frame = 0;

    const targetIntake = this.intake();

    // Custom easing: starts slow, accelerates in middle, slows at end
    const easeInOutQuart = (t: number) => {
      return t < 0.5
        ? 8 * t * t * t * t
        : 1 - Math.pow(-2 * t + 2, 4) / 2;
    };

    const animate = () => {
      frame++;
      const progress = easeInOutQuart(frame / totalFrames);

      this.intakeCircleAnimated.set({
        carbs: targetIntake.carbs * progress,
        fat: targetIntake.fat * progress,
        protein: targetIntake.protein * progress
      });

      if (frame < totalFrames) {
        requestAnimationFrame(animate);
      } else {
        this.intakeCircleAnimated.set(targetIntake);
      }
    };

    requestAnimationFrame(animate);
  }

  getAvg(index: number) {
    const data = this.lineChartData.datasets[index].data as number[];
    if (!data || !data.length) return 0;
    return Math.round(data.reduce((a, b) => a + (b || 0), 0) / data.length);
  }

  // Statistics Controls
  timePeriod = signal<'week' | 'month' | 'year'>('week');
  isPeriodDropdownOpen = signal(false);

  @HostListener('document:click', ['$event'])
  onOutsideClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    // Check if the click was outside the dropdown containers
    if (!target.closest('.period-dropdown-container')) {
      this.isPeriodDropdownOpen.set(false);
    }
    if (!target.closest('.theme-dropdown-container')) {
      this.isThemeDropdownOpen.set(false);
    }
  }

  togglePeriodDropdown() {
    this.isPeriodDropdownOpen.update((v) => !v);
  }

  setPeriod(period: 'week' | 'month' | 'year') {
    this.timePeriod.set(period);
    this.updateStatsData(period);
    this.isPeriodDropdownOpen.set(false);
  }

  getPeriodLabel(): string {
    const labels = {
      week: 'Last Week',
      month: 'Last Month',
      year: 'Last Year',
    };
    return labels[this.timePeriod()];
  }

  changeTimePeriod(event: Event) {
    const val = (event.target as HTMLSelectElement).value as any;
    this.setPeriod(val);
  }

  updateStatsData(period: 'week' | 'month' | 'year') {
    // This will be populated with real data from loadChartData
    // For now, keep the mock structure but it will be overwritten by real data
    if (period === 'year') {
      this.lineChartData.labels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      // Real data would be loaded here from metrics
    } else if (period === 'month') {
      this.lineChartData.labels = Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`);
      // Real data would be loaded here from metrics
    } else {
      // Week view - already loaded from loadChartData
    }
    this.lineChartData = { ...this.lineChartData };
  }

  // Swipe Gestures
  private touchStartPos: number | null = null;
  private touchStartPosY: number | null = null;
  private mouseStartPos: number | null = null;
  private mouseStartPosY: number | null = null;
  private isMouseDown = false;
  private readonly minSwipeDistance = 50;

  // Breakdown View State
  mealBreakdown = signal<any[]>([]);
  expandedMeals = signal<Set<string>>(new Set());

  onTouchStart(e: TouchEvent) {
    this.touchStartPos = e.touches[0].clientX;
    this.touchStartPosY = e.touches[0].clientY;
  }

  onTouchMove(e: TouchEvent) {}

  onTouchEnd(e: TouchEvent) {
    if (!this.touchStartPos || !this.touchStartPosY) return;
    const touchEndPos = e.changedTouches[0].clientX;
    const touchEndPosY = e.changedTouches[0].clientY;
    const distanceX = this.touchStartPos - touchEndPos;
    const distanceY = this.touchStartPosY - touchEndPosY;

    // Determine if swipe is more horizontal or vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (Math.abs(distanceX) > this.minSwipeDistance) {
        if (distanceX > 0) {
          // Swipe Left
          if (this.view() === 'main') this.setPage(1);
        } else {
          // Swipe Right
          if (this.view() === 'stats') this.setPage(0);
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(distanceY) > this.minSwipeDistance) {
        if (distanceY > 0) {
          // Swipe Up - show breakdown
          if (this.view() === 'main') this.openBreakdown();
        } else {
          // Swipe Down - close breakdown
          if (this.view() === 'breakdown') this.closeBreakdown();
        }
      }
    }
    this.touchStartPos = null;
    this.touchStartPosY = null;
  }

  onMouseDown(e: MouseEvent) {
    this.isMouseDown = true;
    this.mouseStartPos = e.clientX;
    this.mouseStartPosY = e.clientY;
  }

  onMouseMove(_e: MouseEvent) {
    if (!this.isMouseDown) return;
  }

  onMouseUp(e: MouseEvent) {
    if (!this.isMouseDown || !this.mouseStartPos || !this.mouseStartPosY) return;

    const mouseEndPos = e.clientX;
    const mouseEndPosY = e.clientY;
    const distanceX = this.mouseStartPos - mouseEndPos;
    const distanceY = this.mouseStartPosY - mouseEndPosY;

    // Determine if swipe is more horizontal or vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      // Horizontal swipe
      if (Math.abs(distanceX) > this.minSwipeDistance) {
        if (distanceX > 0) {
          // Swipe Left
          if (this.view() === 'main') this.setPage(1);
        } else {
          // Swipe Right
          if (this.view() === 'stats') this.setPage(0);
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(distanceY) > this.minSwipeDistance) {
        if (distanceY > 0) {
          // Swipe Up - show breakdown
          if (this.view() === 'main') this.openBreakdown();
        } else {
          // Swipe Down - close breakdown
          if (this.view() === 'breakdown') this.closeBreakdown();
        }
      }
    }

    this.isMouseDown = false;
    this.mouseStartPos = null;
    this.mouseStartPosY = null;
  }

  async openBreakdown() {
    if (this.userTier() === 'basic') return; // Only for premium/pro

    const userId = this.userId();
    if (!userId) return;

    // Fetch meal breakdown data
    const { data } = await this.supabase.getMealBreakdown(userId);
    if (data) {
      this.mealBreakdown.set(data);
    }

    this.view.set('breakdown');
  }

  closeBreakdown() {
    this.view.set('main');
    this.expandedMeals.set(new Set());
  }

  toggleMealExpansion(mealType: string) {
    const expanded = new Set(this.expandedMeals());
    if (expanded.has(mealType)) {
      expanded.delete(mealType);
    } else {
      expanded.add(mealType);
    }
    this.expandedMeals.set(expanded);
  }

  isMealExpanded(mealType: string): boolean {
    return this.expandedMeals().has(mealType);
  }

  getMealIcon(mealType: string): string {
    const icons: Record<string, string> = {
      'Breakfast': '🌅',
      'Lunch': '☀️',
      'Dinner': '🌙',
      'Snack': '🍎'
    };
    return icons[mealType] || '🍽️';
  }

  getMealsByType() {
    const meals = this.mealBreakdown();
    const grouped: Record<string, any> = {};

    meals.forEach(meal => {
      const type = meal.meal_type || 'Other';
      if (!grouped[type]) {
        grouped[type] = {
          type,
          items: [],
          totalCalories: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalProtein: 0
        };
      }
      grouped[type].items.push(meal);
      grouped[type].totalCalories += meal.calories || 0;
      grouped[type].totalCarbs += meal.carbs || 0;
      grouped[type].totalFat += meal.fat || 0;
      grouped[type].totalProtein += meal.protein || 0;
    });

    return Object.values(grouped);
  }
}
