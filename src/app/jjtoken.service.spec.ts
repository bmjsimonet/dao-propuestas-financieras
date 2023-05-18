import { TestBed } from '@angular/core/testing';

import { JjtokenService } from './jjtoken.service';

describe('JjtokenService', () => {
  let service: JjtokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JjtokenService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
