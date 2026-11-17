import { useEffect, useRef } from 'react';

const DATA_REFRESH_EVENT = 'autoresolve:data-refresh';

export const notifyDataChanged = () => {
  window.dispatchEvent(new Event(DATA_REFRESH_EVENT));
};

export default function useAutoRefresh(callback, interval = 15000) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const refresh = () => callbackRef.current();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };

    const timer = window.setInterval(refresh, interval);

    window.addEventListener(DATA_REFRESH_EVENT, refresh);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(DATA_REFRESH_EVENT, refresh);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [interval]);
}
