export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  };
}

export function errorResponse(error: string, errors?: string[]): ApiResponse {
  return {
    success: false,
    error,
    errors
  };
}

export function validationErrorResponse(errors: string[]): ApiResponse {
  return {
    success: false,
    error: 'Validation failed',
    errors
  };
}

export function notFoundResponse(resource: string = 'Resource'): ApiResponse {
  return {
    success: false,
    error: `${resource} not found`
  };
}

export function serverErrorResponse(error?: string): ApiResponse {
  return {
    success: false,
    error: error || 'Internal server error'
  };
}

export function methodNotAllowedResponse(allowedMethods: string[]): ApiResponse {
  return {
    success: false,
    error: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`
  };
}
