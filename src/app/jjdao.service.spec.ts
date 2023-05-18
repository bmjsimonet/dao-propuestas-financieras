import { TestBed } from '@angular/core/testing';

import { JjdaoService } from './jjdao.service';

describe('JjdaoService', () => {
  let service: JjdaoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JjdaoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
