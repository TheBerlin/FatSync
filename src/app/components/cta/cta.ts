import { Component } from '@angular/core';
import { Button } from '../button/button';

@Component({
  selector: 'app-cta',
  standalone: true,
  imports: [Button],
  templateUrl: './cta.html',
  styleUrl: './cta.css',
})
export class Cta {}
