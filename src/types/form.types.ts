export interface FieldValidation {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    errorMessage?: string;
}

export interface FieldOption {
    value: string;
    label: string;
}

export interface FormFieldConfig {
    name: string;
    type: 'input' | 'select' | 'textarea' | 'date' | 'checkbox' | 'radio' | 'file' | 'number' | 'password' | 'tel' | 'url' | 'time' | 'datetime-local' | 'search' | 'color' | 'range' | 'email' | 'hidden' | 'button' | 'reset' | 'submit';
    label: string;
    placeholder?: string;
    options?: FieldOption[];
    validation?: FieldValidation;
}

export interface SubmitButtonConfig {
    label: string;
    api: string; // API endpoint for form submission
}

export interface FormConfig {
    fields: FormFieldConfig[];
    submitButton: SubmitButtonConfig;
}
