import { useNavigate } from 'react-router-dom';

/**
 * Returns a function that navigates back in history,
 * falling back to `fallback` route when there's no history (direct navigation/refresh).
 */
export function useGoBack(fallback = '/') {
  const navigate = useNavigate();
  return () => {
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}