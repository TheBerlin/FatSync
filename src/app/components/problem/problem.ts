import { Component } from '@angular/core';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import {
  ArrowDataTransferDiagonalIcon,
  TimeQuarter02Icon,
  User03Icon,
} from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-problem',
  imports: [HugeiconsIconComponent],
  standalone: true,
  templateUrl: './problem.html',
  styleUrl: './problem.css',
})
export class Problem {
  ArrowIcon = ArrowDataTransferDiagonalIcon;
  TimeIcon = TimeQuarter02Icon;
  UserIcon = User03Icon;
}
