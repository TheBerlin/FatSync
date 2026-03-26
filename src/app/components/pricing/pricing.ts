import { Component } from '@angular/core';
import { Button } from '../button/button';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [Button],
  templateUrl: './pricing.html',
  styleUrl: './pricing.css',
})
export class Pricing {}
