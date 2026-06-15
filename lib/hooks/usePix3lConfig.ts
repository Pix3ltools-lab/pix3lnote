import { useState, useEffect } from 'react';

interface Pix3lConfig {
  pix3lboardUrl: string;
}

const DEFAULT_CONFIG: Pix3lConfig = {
  pix3lboardUrl: 'https://board.pix3ltools.com',
};

export function usePix3lConfig(): Pix3lConfig {
  const [config, setConfig] = useState<Pix3lConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const windowConfig = (window as any).__PIX3L_CONFIG__;
    if (windowConfig?.pix3lboardUrl) {
      setConfig({ pix3lboardUrl: windowConfig.pix3lboardUrl });
    }
  }, []);

  return config;
}
