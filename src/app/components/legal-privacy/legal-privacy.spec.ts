import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LegalPrivacy } from './legal-privacy';

describe('LegalPrivacy', () => {
  let component: LegalPrivacy;
  let fixture: ComponentFixture<LegalPrivacy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LegalPrivacy],
    }).compileComponents();

    fixture = TestBed.createComponent(LegalPrivacy);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
