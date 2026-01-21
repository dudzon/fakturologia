import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { map, Observable } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * Interface for components that can be checked for unsaved changes.
 */
export interface CanDeactivateComponent {
  canDeactivate(): boolean;
}

/**
 * Guard that warns users about unsaved changes before leaving a page.
 *
 * The component must implement the CanDeactivateComponent interface
 * with a canDeactivate() method that returns true if it's safe to leave.
 */
export const canDeactivateGuard: CanDeactivateFn<CanDeactivateComponent> = (
  component,
): Observable<boolean> | boolean => {
  // If component allows deactivation, proceed
  if (component.canDeactivate()) {
    return true;
  }

  // Otherwise, show confirmation dialog
  const dialog = inject(MatDialog);

  const dialogData: ConfirmDialogData = {
    title: 'Niezapisane zmiany',
    message:
      'Masz niezapisane zmiany. Czy na pewno chcesz opuścić tę stronę? Wszystkie niezapisane dane zostaną utracone.',
    confirmText: 'Opuść stronę',
    cancelText: 'Zostań',
    confirmColor: 'warn',
  };

  const dialogRef = dialog.open(ConfirmDialogComponent, {
    data: dialogData,
    width: '400px',
    disableClose: true,
  });

  return dialogRef.afterClosed().pipe(map((result: boolean) => result === true));
};
