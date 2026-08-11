import { useMutation } from '@tanstack/react-query';
import {
  submitPartnerInterest,
  type CreatePartnerInterestDto,
} from '../api/partner-interest';

export function useSubmitPartnerInterest() {
  return useMutation({
    mutationFn: (data: CreatePartnerInterestDto) =>
      submitPartnerInterest(data),
  });
}
