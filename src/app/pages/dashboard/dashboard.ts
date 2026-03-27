import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Supabase } from '../../services/supabase';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})

export class Dashboard {
  public supabase = inject(Supabase);
  
  isPaid: boolean = false;
  user = {name: "Alex"};

  notionConnected: boolean = true;
  fatSecretConnected: boolean = true;

  handleSync() {
    console.log("Syncing data...");
  }

  userProfile = signal<any>(null);
  /**
   * Check if user has a premium plan
   */
  ngOnInit() {
    console.log("Checking user profile...");
    this.supabase.auth.getUser().then(user => {
      this.userProfile.set(user);
      console.log(user);

      
    });
  }
}
