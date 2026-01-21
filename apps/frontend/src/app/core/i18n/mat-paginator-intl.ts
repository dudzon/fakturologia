import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

/**
 * Custom implementation of MatPaginatorIntl for Polish language.
 * Provides translated labels for pagination components.
 */
@Injectable()
export class PolishMatPaginatorIntl extends MatPaginatorIntl {
  override itemsPerPageLabel = 'Pozycji na stronie:';
  override nextPageLabel = 'Następna strona';
  override previousPageLabel = 'Poprzednia strona';
  override firstPageLabel = 'Pierwsza strona';
  override lastPageLabel = 'Ostatnia strona';

  override getRangeLabel = (page: number, pageSize: number, length: number): string => {
    if (length === 0 || pageSize === 0) {
      return `0 z ${length}`;
    }

    const maxLength = Math.max(length, 0);
    const startIndex = page * pageSize;

    // If the start index exceeds the list length, do not try and fix the end index to the end.
    const endIndex =
      startIndex < maxLength ? Math.min(startIndex + pageSize, maxLength) : startIndex + pageSize;

    return `${startIndex + 1} – ${endIndex} z ${maxLength}`;
  };
}
