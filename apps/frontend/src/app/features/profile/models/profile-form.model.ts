/**
 * Profile form value type.
 * Local type for the reactive form, differs from API types.
 */
export interface ProfileFormValue {
  companyName: string;
  nip: string;
  address: string;
  bankAccount: string;
  invoiceNumberFormat: string;
}

/**
 * Profile completeness state for the indicator.
 */
export interface ProfileCompletenessState {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: ProfileRequiredField[];
}

/**
 * Required fields for profile to issue invoices.
 */
export type ProfileRequiredField = 'companyName' | 'nip' | 'address';

/**
 * Profile required field metadata for display.
 */
export interface ProfileRequiredFieldMeta {
  key: ProfileRequiredField;
  label: string;
  filled: boolean;
}
