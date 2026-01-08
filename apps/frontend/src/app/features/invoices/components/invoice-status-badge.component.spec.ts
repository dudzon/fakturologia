import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';
import { InvoiceStatusBadgeComponent } from './invoice-status-badge.component';
import type { InvoiceStatus } from '../../../../types';

describe('InvoiceStatusBadgeComponent', () => {
  let component: InvoiceStatusBadgeComponent;
  let fixture: ComponentFixture<InvoiceStatusBadgeComponent>;

  beforeAll(() => {
    // Initialize TestBed environment once for this test file
    TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceStatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceStatusBadgeComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture?.destroy();
    TestBed.resetTestingModule();
  });

  describe('draft status', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('status', 'draft');
      fixture.detectChanges();
    });

    it('should display draft label', () => {
      const element = fixture.nativeElement as HTMLElement;
      const label = element.querySelector('.status-badge__label');
      expect(label?.textContent?.trim()).toBe('Szkic');
    });

    it('should display draft icon', () => {
      const element = fixture.nativeElement as HTMLElement;
      const icon = element.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('edit_note');
    });

    it('should apply draft CSS class', () => {
      const element = fixture.nativeElement as HTMLElement;
      const badge = element.querySelector('.status-badge');
      expect(badge?.classList.contains('status-badge--draft')).toBe(true);
    });

    it('should have correct aria-label', () => {
      const element = fixture.nativeElement as HTMLElement;
      const badge = element.querySelector('.status-badge');
      expect(badge?.getAttribute('aria-label')).toBe('Status: Szkic');
    });
  });

  describe('unpaid status', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('status', 'unpaid');
      fixture.detectChanges();
    });

    it('should display unpaid label', () => {
      const element = fixture.nativeElement as HTMLElement;
      const label = element.querySelector('.status-badge__label');
      expect(label?.textContent?.trim()).toBe('Nieopłacona');
    });

    it('should display unpaid icon', () => {
      const element = fixture.nativeElement as HTMLElement;
      const icon = element.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('schedule');
    });

    it('should apply unpaid CSS class', () => {
      const element = fixture.nativeElement as HTMLElement;
      const badge = element.querySelector('.status-badge');
      expect(badge?.classList.contains('status-badge--unpaid')).toBe(true);
    });

    it('should have correct aria-label', () => {
      const element = fixture.nativeElement as HTMLElement;
      const badge = element.querySelector('.status-badge');
      expect(badge?.getAttribute('aria-label')).toBe('Status: Nieopłacona');
    });
  });

  describe('paid status', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('status', 'paid');
      fixture.detectChanges();
    });

    it('should display paid label', () => {
      const element = fixture.nativeElement as HTMLElement;
      const label = element.querySelector('.status-badge__label');
      expect(label?.textContent?.trim()).toBe('Opłacona');
    });

    it('should display paid icon', () => {
      const element = fixture.nativeElement as HTMLElement;
      const icon = element.querySelector('mat-icon');
      expect(icon?.textContent?.trim()).toBe('check_circle');
    });

    it('should apply paid CSS class', () => {
      const element = fixture.nativeElement as HTMLElement;
      const badge = element.querySelector('.status-badge');
      expect(badge?.classList.contains('status-badge--paid')).toBe(true);
    });

    it('should have correct aria-label', () => {
      const element = fixture.nativeElement as HTMLElement;
      const badge = element.querySelector('.status-badge');
      expect(badge?.getAttribute('aria-label')).toBe('Status: Opłacona');
    });
  });

  describe('computed config signal', () => {
    it('should compute correct config for draft', () => {
      fixture.componentRef.setInput('status', 'draft');
      fixture.detectChanges();

      const config = component.config();
      expect(config.label).toBe('Szkic');
      expect(config.icon).toBe('edit_note');
      expect(config.cssClass).toBe('status-badge--draft');
    });

    it('should compute correct config for unpaid', () => {
      fixture.componentRef.setInput('status', 'unpaid');
      fixture.detectChanges();

      const config = component.config();
      expect(config.label).toBe('Nieopłacona');
      expect(config.icon).toBe('schedule');
      expect(config.cssClass).toBe('status-badge--unpaid');
    });

    it('should compute correct config for paid', () => {
      fixture.componentRef.setInput('status', 'paid');
      fixture.detectChanges();

      const config = component.config();
      expect(config.label).toBe('Opłacona');
      expect(config.icon).toBe('check_circle');
      expect(config.cssClass).toBe('status-badge--paid');
    });
  });

  describe('reactive updates', () => {
    it('should update when status changes', () => {
      fixture.componentRef.setInput('status', 'draft');
      fixture.detectChanges();

      let element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.status-badge__label')?.textContent?.trim()).toBe('Szkic');

      fixture.componentRef.setInput('status', 'paid');
      fixture.detectChanges();

      element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.status-badge__label')?.textContent?.trim()).toBe('Opłacona');
    });
  });
});
