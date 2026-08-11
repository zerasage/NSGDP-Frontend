import { apiClient } from './client';

export interface CreatePartnerInterestDto {
  organisationName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  message: string;
  website?: string; // Honeypot field
}

export interface PartnerInterestResponse {
  success: boolean;
  message: string;
  id: string;
}

export async function submitPartnerInterest(
  data: CreatePartnerInterestDto,
): Promise<PartnerInterestResponse> {
  const response = await apiClient.post<PartnerInterestResponse>(
    '/partner-interest',
    data,
  );
  return response.data;
}
