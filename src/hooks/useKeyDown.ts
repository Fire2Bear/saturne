import {useCallback, useEffect} from 'react';
export const useKeyDown = (callback: (key: string) => void, keys: string[]) => {
  const onKeyDown = useCallback((event: any) => {
    const wasAnyKeyPressed = keys.some((key) => event.key === key);
    if (wasAnyKeyPressed) {
      event.preventDefault();
      callback(event.key);
    }
  }, [keys]);
  useEffect(() => {
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onKeyDown]);
};
