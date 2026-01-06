import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';

import { InvoiceNumberPreviewComponent } from './invoice-number-preview.component';

describe('InvoiceNumberPreviewComponent', () => {
  let fixture: ComponentFixture<InvoiceNumberPreviewComponent>;
  let component: InvoiceNumberPreviewComponent;

  beforeAll(() => {
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting()
    );
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceNumberPreviewComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceNumberPreviewComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default empty format', () => {
      expect(component.format()).toBe('');
    });

    it('should have default counter of 1', () => {
      expect(component.counter()).toBe(1);
    });
  });

  describe('previewNumber computed signal', () => {
    it('should return empty string when format is empty', () => {
      fixture.componentRef.setInput('format', '');
      fixture.componentRef.setInput('counter', 1);
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('');
    });

    it('should generate preview with simple format', () => {
      fixture.componentRef.setInput('format', 'FV/{NNN}');
      fixture.componentRef.setInput('counter', 1);
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('FV/001');
    });

    it('should generate preview with year placeholder', () => {
      fixture.componentRef.setInput('format', 'FV/{YYYY}/{NNN}');
      fixture.componentRef.setInput('counter', 5);
      fixture.detectChanges();

      const result = component.previewNumber();
      expect(result).toMatch(/^FV\/\d{4}\/005$/);
    });

    it('should generate preview with month placeholder', () => {
      fixture.componentRef.setInput('format', 'FV/{MM}/{NNN}');
      fixture.componentRef.setInput('counter', 10);
      fixture.detectChanges();

      const result = component.previewNumber();
      expect(result).toMatch(/^FV\/\d{2}\/010$/);
    });

    it('should generate preview with year and month placeholders', () => {
      fixture.componentRef.setInput('format', 'FV/{YYYY}/{MM}/{NNN}');
      fixture.componentRef.setInput('counter', 123);
      fixture.detectChanges();

      const result = component.previewNumber();
      expect(result).toMatch(/^FV\/\d{4}\/\d{2}\/123$/);
    });

    it('should pad counter with zeros for NNN placeholder', () => {
      fixture.componentRef.setInput('format', '{NNN}');
      fixture.componentRef.setInput('counter', 7);
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('007');
    });

    it('should handle large counter values', () => {
      fixture.componentRef.setInput('format', 'INV/{NNN}');
      fixture.componentRef.setInput('counter', 999);
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('INV/999');
    });

    it('should update when format changes', () => {
      fixture.componentRef.setInput('format', 'FV/{NNN}');
      fixture.componentRef.setInput('counter', 1);
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('FV/001');

      fixture.componentRef.setInput('format', 'INV/{NNN}');
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('INV/001');
    });

    it('should update when counter changes', () => {
      fixture.componentRef.setInput('format', 'FV/{NNN}');
      fixture.componentRef.setInput('counter', 1);
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('FV/001');

      fixture.componentRef.setInput('counter', 50);
      fixture.detectChanges();

      expect(component.previewNumber()).toBe('FV/050');
    });
  });

  describe('DOM Rendering', () => {
    it('should render preview label with icon', () => {
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.preview-label');
      expect(label).toBeTruthy();

      const icon = label?.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('visibility');

      const text = label?.querySelector('span');
      expect(text?.textContent).toBe('Podgląd numeru faktury:');
    });

    it('should display preview number when format is provided', () => {
      fixture.componentRef.setInput('format', 'FV/{NNN}');
      fixture.componentRef.setInput('counter', 1);
      fixture.detectChanges();

      const previewNumber = fixture.nativeElement.querySelector('.preview-number');
      expect(previewNumber).toBeTruthy();
      expect(previewNumber?.textContent?.trim()).toBe('FV/001');
    });

    it('should display empty state when format is not provided', () => {
      fixture.componentRef.setInput('format', '');
      fixture.detectChanges();

      const previewEmpty = fixture.nativeElement.querySelector('.preview-empty');
      expect(previewEmpty).toBeTruthy();
      expect(previewEmpty?.textContent).toContain('Wprowadź format, aby zobaczyć podgląd');
    });

    it('should not display preview number when format is empty', () => {
      fixture.componentRef.setInput('format', '');
      fixture.detectChanges();

      const previewNumber = fixture.nativeElement.querySelector('.preview-number');
      expect(previewNumber).toBeNull();
    });

    it('should display hint with counter value', () => {
      fixture.componentRef.setInput('counter', 42);
      fixture.detectChanges();

      const hint = fixture.nativeElement.querySelector('.preview-hint');
      expect(hint).toBeTruthy();
      expect(hint?.textContent).toContain('Następna faktura będzie miała numer 42');
    });

    it('should update displayed counter when input changes', () => {
      fixture.componentRef.setInput('counter', 10);
      fixture.detectChanges();

      let hint = fixture.nativeElement.querySelector('.preview-hint');
      expect(hint?.textContent).toContain('10');

      fixture.componentRef.setInput('counter', 100);
      fixture.detectChanges();

      hint = fixture.nativeElement.querySelector('.preview-hint');
      expect(hint?.textContent).toContain('100');
    });

    it('should update displayed preview when format changes', () => {
      fixture.componentRef.setInput('format', 'FV/{NNN}');
      fixture.componentRef.setInput('counter', 5);
      fixture.detectChanges();

      let previewNumber = fixture.nativeElement.querySelector('.preview-number');
      expect(previewNumber?.textContent?.trim()).toBe('FV/005');

      fixture.componentRef.setInput('format', 'INV/{NNN}');
      fixture.detectChanges();

      previewNumber = fixture.nativeElement.querySelector('.preview-number');
      expect(previewNumber?.textContent?.trim()).toBe('INV/005');
    });
  });
});
