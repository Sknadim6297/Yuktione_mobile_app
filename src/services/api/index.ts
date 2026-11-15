export {
  apiClient,
  apiRequest,
  ApiClientError,
} from './client';
export type { ApiRequestMode, ExtendedRequestOptions } from './client';

export {
  fetchProfessionalAvailability,
  fetchAvailableDates,
  fetchAvailableSlots,
  currentMonthKey,
  shiftMonthKey,
  formatMonthLabel,
} from './availability';

export { getAuthToken, setAuthToken, clearAuthToken } from './tokenStorage';
export {
  loginCustomer,
  logoutCustomer,
  fetchCurrentUser,
  requestPasswordReset,
  saveCustomerLead,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  createIncompleteCustomer,
  completeCustomerRegistration,
} from './auth';
export type { ApiUser, ApiCustomerProfile, LoginSuccess, LoginOutcome } from './auth';
export {
  fetchToolCategories,
  fetchTools,
  fetchTool,
  fetchExperts,
  fetchExpert,
  fetchProgrammeEvents,
} from './catalog';
export type { ApiTool, ApiToolCategory, ApiExpert, ApiProgrammeEvent } from './catalog';
export { fetchProfile, updateProfile } from './profile';
export type { ProfileUpdateInput } from './profile';
export type { ApiErrorBody, ApiResult, HttpMethod, RequestOptions } from './types';
