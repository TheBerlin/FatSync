import { Component } from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { FilterIcon, FingerAccessIcon, ShieldKeyIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-security',
  imports: [HugeiconsIconComponent],
  standalone: true,
  templateUrl: './security.html',
  styleUrl: './security.css',
})
export class Security {
  KeyIcon = FingerAccessIcon;
  FilterIcon = FilterIcon;
}
