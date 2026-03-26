import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  @Input() variant: 'primary' | 'secondary' | 'white' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() icon?: string;
  @Input() fullWidth: boolean = false;
  @Input() link?: string | any[];

  getClasses(): string {
    const base = 'btn-base';
    const variantClass = `btn-${this.variant}`;
    const sizeClass = `btn-${this.size}`;
    const widthClass = this.fullWidth ? 'btn-full' : '';
    return `${base} ${variantClass} ${sizeClass} ${widthClass}`;
  }
}
