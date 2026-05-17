'use client';
import { useState, useEffect } from 'react';

export function useMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
      const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const narrow = window.innerWidth < breakpoint;
      setIsMobile(mobileUA || narrow);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);

  return isMobile;
}

export function useApkAvailable(apkPath = '/downloads/password-hunter.apk') {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAvailability = async () => {
      try {
        let response = await fetch(apkPath, { method: 'HEAD', cache: 'no-store' });
        if (!response.ok && (response.status === 403 || response.status === 405)) {
          response = await fetch(apkPath, { method: 'GET', cache: 'no-store' });
        }

        if (!cancelled) {
          setAvailable(response.ok);
        }
      } catch {
        if (!cancelled) {
          setAvailable(false);
        }
      }
    };

    void checkAvailability();
    return () => { cancelled = true; };
  }, [apkPath]);

  return available;
}
