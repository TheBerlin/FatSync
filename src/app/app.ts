import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';
import { Supabase } from './services/supabase';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { ArrowUp02Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, Footer, RouterModule, HugeiconsIconComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  ArrowIcon = ArrowUp02Icon;
  public supabase = inject(Supabase);
  private router = inject(Router);

  isWidgetRoute = signal(false);

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        this.isWidgetRoute.set(url.includes('/widget') || url.includes('/embed'));
      });
  }

  isDashboard = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.includes('/dashboard')),
    ),
    { initialValue: false },
  );

  isVisible = signal(false);
  private readonly SCROLL_THRESHOLD = 300;

  /**
   * Handle window scroll event
   */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const verticalOffset =
      window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

    this.isVisible.set(verticalOffset > this.SCROLL_THRESHOLD);
  }

  /**
   * Scroll to top of the page
   */
  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  /**
   * Handle auth state change
   */
  ngOnInit(): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        this.router.navigate(['/login']);
      }
    });
  }

  protected readonly title = signal('frontend-landing');
}
