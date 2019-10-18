import { TestBed } from '@angular/core/testing';

import { ScriptLoadService } from './script-load.service';

describe('ScriptLoadService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ScriptLoadService = TestBed.get(ScriptLoadService);
    expect(service).toBeTruthy();
  });
});
