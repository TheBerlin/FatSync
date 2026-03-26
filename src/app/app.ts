import { Component, inject, OnInit, signal } from '@angular/core';
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

  ngOnInit(): void {
    this.supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);

      if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting...');
        this.router.navigate(['/login']);
      }
    });
  }

  protected readonly title = signal('frontend-landing');
}
