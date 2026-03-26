import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalTerms } from './legal-terms';

describe('LegalTerms', () => {
  let component: LegalTerms;
  let fixture: ComponentFixture<LegalTerms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalTerms],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalTerms);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
