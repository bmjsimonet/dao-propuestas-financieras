import { TestBed } from '@angular/core/testing';

import { Web3managerService } from './web3manager.service';

describe('Web3managerService', () => {
  let service: Web3managerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Web3managerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
