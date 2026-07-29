import { toast } from 'sonner';

export function toastSuccess(message: string, description?: string) {
  toast.success(message, {
    description,
    duration: 3000,
  });
}

export function toastError(message: string, description?: string) {
  toast.error(message, {
    description,
    duration: 5000,
  });
}

export function toastInfo(message: string, description?: string) {
  toast.info(message, {
    description,
    duration: 3000,
  });
}

export function toastWarning(message: string, description?: string) {
  toast.warning(message, {
    description,
    duration: 4000,
  });
}
