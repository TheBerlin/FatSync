import { Component } from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  ApricotIcon,
  ArrowReloadHorizontalIcon,
  CalendarSyncIcon,
  CpuIcon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-solution',
  imports: [HugeiconsIconComponent],
  standalone: true,
  templateUrl: './solution.html',
  styleUrl: './solution.css',
})
export class Solution {
  ArrowIcon = ArrowReloadHorizontalIcon;
  FruitIcon = ApricotIcon;
  CalendarIcon = CalendarSyncIcon;
  AutoModeiIcon = CpuIcon;
}
