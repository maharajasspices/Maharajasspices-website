import { useEffect, useRef, useState } from "react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
}

const RevealOnScroll = ({ 
  children, 
  className = "", 
  delay = 0, 
  direction = "up" 
}: RevealOnScrollProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
          }, delay);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [delay]);

  const getAnimationClass = () => {
    const base = "transition-all duration-700 ease-out";
    if (!isVisible) {
      switch (direction) {
        case "up":
          return `${base} opacity-0 translate-y-8`;
        case "down":
          return `${base} opacity-0 -translate-y-8`;
        case "left":
          return `${base} opacity-0 translate-x-8`;
        case "right":
          return `${base} opacity-0 -translate-x-8`;
        case "scale":
          return `${base} opacity-0 scale-95`;
        default:
          return `${base} opacity-0 translate-y-8`;
      }
    }
    return `${base} opacity-100 translate-y-0 translate-x-0 scale-100`;
  };

  return (
    <div ref={ref} className={`${getAnimationClass()} ${className}`}>
      {children}
    </div>
  );
};

export default RevealOnScroll;