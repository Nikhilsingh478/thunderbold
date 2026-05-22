export function successResponse(data) {
  return {
    success: true,
    data
  };
}

export function errorResponse(error, errors) {
  return {
    success: false,
    error,
    errors
  };
}

export function validationErrorResponse(errors) {
  return {
    success: false,
    error: 'Validation failed',
    errors
  };
}

export function notFoundResponse(resource) {
  resource = resource || 'Resource';
  return {
    success: false,
    error: `${resource} not found`
  };
}

export function serverErrorResponse(error) {
  return {
    success: false,
    error: error || 'Internal server error'
  };
}

export function methodNotAllowedResponse(allowedMethods) {
  return {
    success: false,
    error: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`
  };
}
