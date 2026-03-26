import { Component } from '@angular/core';
import { Security } from '../security/security';
import { Pricing } from '../pricing/pricing';
import { Cta } from '../cta/cta';
import { Solution } from '../solution/solution';
import { Problem } from '../problem/problem';
import { Hero } from '../hero/hero';

@Component({
  selector: 'app-landing-component',
  imports: [Hero, Problem, Solution, Security, Pricing, Cta],
  templateUrl: './landing-component.html',
  styleUrl: './landing-component.css',
})
export class LandingComponent {}
