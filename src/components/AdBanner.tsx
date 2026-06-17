import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const AD_CLIENT = 'ca-pub-2907570786908057';
const AD_SLOT = '2897201623';

export const AdBanner: React.FC = () => {
  const pushedRef = useRef(false);

  useEffect(() => {
    if (pushedRef.current) return;
    pushedRef.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.warn('AdSense広告の読み込みに失敗しました（広告ブロッカー等の可能性）', err);
    }
  }, []);

  return (
    <div className="ad-slot">
      <ins
        className="adsbygoogle"
        style={{ display: 'inline-block', width: '250px', height: '100px' }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOT}
      />
    </div>
  );
};
