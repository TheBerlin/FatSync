import { Component, inject } from '@angular/core';
import { Button } from '../button/button';
import { RouterLink } from '@angular/router';
import { Login } from '../../pages/login/login';
import { Supabase } from '../../services/supabase';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { Cancel01Icon, LogoutSquare01Icon, Menu01Icon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Button, RouterLink, Login, HugeiconsIconComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  MenuIcon = Menu01Icon;
  CloseIcon = Cancel01Icon;
  LogoutIcon = LogoutSquare01Icon;
  public supabase = inject(Supabase);

  isMenuOpen = false;
  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
