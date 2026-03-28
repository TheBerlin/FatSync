import { Component } from '@angular/core';
import { Button } from '../button/button';
import { CommonModule } from '@angular/common';
import { HugeiconsIconComponent } from '@hugeicons/angular';
import { PlayIcon } from '@hugeicons/core-free-icons';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [Button, CommonModule, HugeiconsIconComponent],
  templateUrl: './hero.html',
  styleUrl: './hero.css',
})
export class Hero {
  // Icon
  PlayIcon = PlayIcon;

  // Modal
  isModalOpen = false;

  openModal() {
    this.isModalOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.isModalOpen = false;
    document.body.style.overflow = '';
    // Pause video when closing
    const video = document.querySelector('.demo-video') as HTMLVideoElement;
    if (video) video.pause();
  }
}
