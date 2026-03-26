import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
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
}
