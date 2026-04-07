export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phone) {
    errors.push('Phone number is required');
  } else {
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      errors.push('Phone number must be exactly 10 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validatePincode(pincode: string): ValidationResult {
  const errors: string[] = [];
  
  if (!pincode) {
    errors.push('Pincode is required');
  } else {
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode.replace(/\D/g, ''))) {
      errors.push('Pincode must be exactly 6 digits');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateRequired(value: string, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!value || value.trim() === '') {
    errors.push(`${fieldName} is required`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateAddress(address: {
  fullName: string;
  phone: string;
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}): ValidationResult {
  const allErrors: string[] = [];
  
  const nameValidation = validateRequired(address.fullName, 'Full name');
  const phoneValidation = validatePhone(address.phone);
  const addressLine1Validation = validateRequired(address.addressLine1, 'Address line 1');
  const cityValidation = validateRequired(address.city, 'City');
  const stateValidation = validateRequired(address.state, 'State');
  const pincodeValidation = validatePincode(address.pincode);
  
  allErrors.push(
    ...nameValidation.errors,
    ...phoneValidation.errors,
    ...addressLine1Validation.errors,
    ...cityValidation.errors,
    ...stateValidation.errors,
    ...pincodeValidation.errors
  );
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

export function validateOrder(order: {
  product: {
    name: string;
    price: string;
    size: string;
    quantity: number;
  };
}): ValidationResult {
  const allErrors: string[] = [];
  
  if (!order.product) {
    allErrors.push('Product information is required');
    return {
      isValid: false,
      errors: allErrors
    };
  }
  
  const nameValidation = validateRequired(order.product.name, 'Product name');
  const priceValidation = validateRequired(order.product.price, 'Product price');
  const sizeValidation = validateRequired(order.product.size, 'Product size');
  
  if (!order.product.quantity || order.product.quantity <= 0) {
    allErrors.push('Product quantity must be greater than 0');
  }
  
  allErrors.push(
    ...nameValidation.errors,
    ...priceValidation.errors,
    ...sizeValidation.errors
  );
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}
