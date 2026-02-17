/**
 * Base Modal Props Interface
 * All modal components should extend this base interface for consistency
 */

export interface BaseModalProps {
  /** Controls whether the modal is visible */
  isOpen: boolean;
  
  /** Called when the modal should close */
  onClose: () => void;
  
  /** Optional fallback content when modal is not open */
  fallback?: React.ReactNode;
  
  /** Optional custom className for the modal container */
  className?: string;
}

/**
 * Modal with success callback
 * Used for modals that create or update data
 */
export interface BaseModalWithSuccessProps extends BaseModalProps {
  onSuccess?: () => void;
}

/**
 * Modal with save callback
 * Used for modals that save/submit data
 */
export interface BaseModalWithSaveProps extends BaseModalProps {
  onSave?: (data: any) => void | Promise<void>;
}

/**
 * Modal with submit callback
 * Used for modals that submit data
 */
export interface BaseModalWithSubmitProps extends BaseModalProps {
  onSubmit: (data: any) => void | Promise<void>;
}

/**
 * Modal with data argument
 * Used for modals that display/edit existing data
 */
export interface BaseModalWithDataProps<T = any> extends BaseModalProps {
  data?: T;
  onSave?: (updatedData: T) => void | Promise<void>;
}

/**
 * Common Modal Sizes
 */
export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Get Tailwind classes for modal size
 */
export const getModalSizeClasses = (size: ModalSize = 'md'): string => {
  const sizes: Record<ModalSize, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };
  return sizes[size];
};

/**
 * Modal Provider Context Type
 * For global modal management if needed
 */
export interface ModalContextType {
  openModal: (id: string, props?: any) => void;
  closeModal: (id: string) => void;
  closeAll: () => void;
}
