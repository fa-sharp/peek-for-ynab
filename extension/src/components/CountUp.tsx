import { CountUp as CountUpInit } from "countup.js";
import { useEffect, useRef, useState } from "react";

interface Props {
  className?: string;
  start: number;
  end: number;
  duration: number;
  formattingFn: (num: number) => string;
}

/** Changing number animation using countup.js */
export default function CountUp({
  className,
  start,
  end,
  duration,
  formattingFn,
}: Props) {
  const containerRef = useRef<HTMLSpanElement>(null);

  const startRef = useRef(start);
  const endRef = useRef(end);
  const durationRef = useRef(duration);
  const formattingFnRef = useRef(formattingFn);

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let countup: CountUpInit | undefined;
    async function startCountUp() {
      countup = new CountUpInit(containerRef.current!, endRef.current, {
        startVal: startRef.current,
        duration: durationRef.current,
        onStartCallback: () => setIsAnimating(true),
        onCompleteCallback: () => setIsAnimating(false),
        formattingFn: formattingFnRef.current,
      });
      if (!countup.error) {
        countup.start();
      } else {
        console.error(countup.error);
      }
    }
    startCountUp();

    return () => {
      countup?.onDestroy();
    };
  }, []);

  return (
    <span ref={containerRef} className={className} aria-busy={isAnimating}>
      {formattingFn(start)}
    </span>
  );
}
