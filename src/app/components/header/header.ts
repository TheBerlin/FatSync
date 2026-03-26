import { Component } from '@angular/core';
import { Button } from '../button/button';
import { RouterLink } from '@angular/router';
import { Login } from '../../pages/login/login';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [Button, RouterLink, Login],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {}
