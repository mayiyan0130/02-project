import { useEffect, useMemo, useState } from 'react';

interface TypewriterProps {
  text: string;
  speed?: number;
}

export function Typewriter({ text, speed = 18 }: TypewriterProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    const characters = Array.from(text);
    const interval = window.setInterval(() => {
      setDisplayText((current) => {
        if (current.length >= characters.length) {
          window.clearInterval(interval);
          return current;
        }

        return characters.slice(0, current.length + 1).join('');
      });
    }, speed);

    return () => window.clearInterval(interval);
  }, [speed, text]);

  const safeText = useMemo(() => displayText || '……', [displayText]);

  return <p className="typewriter-text">{safeText}</p>;
}
