import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Web3debugComponent } from './web3debug.component';

describe('Web3debugComponent', () => {
  let component: Web3debugComponent;
  let fixture: ComponentFixture<Web3debugComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Web3debugComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Web3debugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
