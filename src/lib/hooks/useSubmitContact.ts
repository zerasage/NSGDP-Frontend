import { useMutation } from '@tanstack/react-query';
import { submitContactMessage, type SubmitContactPayload } from '../api/contact';

export function useSubmitContact() {
  return useMutation({
    mutationFn: (data: SubmitContactPayload) => submitContactMessage(data),
  });
}
