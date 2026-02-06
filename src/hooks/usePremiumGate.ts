import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Returns a function that checks premium access before executing a callback.
 * If the content is premium and the user has no subscription, navigates to /subscribe.
 */
export const usePremiumGate = () => {
  const { user, hasActiveSubscription } = useAuth();
  const navigate = useNavigate();

  const checkAccess = (isPremium?: boolean, onAllow?: () => void) => {
    if (isPremium && !hasActiveSubscription) {
      if (!user) {
        navigate('/login', { state: { returnTo: '/subscribe' } });
      } else {
        navigate('/subscribe');
      }
      return false;
    }
    onAllow?.();
    return true;
  };

  return { checkAccess, hasActiveSubscription };
};
