import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { Footer } from './components/footer/footer';
import { Header } from './components/header/header';
import { Supabase } from './services/supabase';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Header, Footer, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private supabase = inject(Supabase);
  private router = inject(Router);

  isVisible = signal(false);
  private readonly SCROLL_THRESHOLD = 300;

  
  /**
   * Handle window scroll event
  */
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const verticalOffset = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

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
