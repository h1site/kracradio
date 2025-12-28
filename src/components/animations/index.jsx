'use client';
// src/components/animations/index.jsx
// CSS-based animations - No framer-motion dependency

import React, { useRef, useEffect, useState } from 'react';

// CSS styles for animations - inject once
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-40px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes fadeInLeft {
    from { opacity: 0; transform: translateX(40px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(-40px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-100px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(100px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(-100px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(var(--pulse-scale, 1.05)); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(calc(var(--float-y, 10px) * -1)); }
    50% { transform: translateY(var(--float-y, 10px)); }
  }

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  }

  .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
  .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
  .animate-fade-in-down { animation: fadeInDown 0.5s ease-out forwards; }
  .animate-fade-in-left { animation: fadeInLeft 0.5s ease-out forwards; }
  .animate-fade-in-right { animation: fadeInRight 0.5s ease-out forwards; }
  .animate-scale-in { animation: scaleIn 0.4s ease-out forwards; }
  .animate-slide-in-left { animation: slideInLeft 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }
  .animate-slide-in-right { animation: slideInRight 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }
  .animate-slide-in-up { animation: slideInUp 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }
  .animate-slide-in-down { animation: slideInDown 0.6s cubic-bezier(0.25, 0.1, 0.25, 1) forwards; }
  .animate-pulse-custom { animation: pulse var(--pulse-duration, 2s) ease-in-out infinite; }
  .animate-float { animation: float var(--float-duration, 3s) ease-in-out infinite; }
  .animate-shake { animation: shake 0.5s ease-in-out; }

  .hover-scale { transition: transform 0.2s ease; }
  .hover-scale:hover { transform: scale(1.02); }
  .hover-scale:active { transform: scale(0.98); }

  .hover-lift { transition: transform 0.2s ease, box-shadow 0.2s ease; }
  .hover-lift:hover { transform: translateY(-5px) scale(1.02); }

  .stagger-item { opacity: 0; }
  .stagger-item.animate { animation: fadeInUp 0.4s ease-out forwards; }
`;

// Inject styles once
let stylesInjected = false;
function injectStyles() {
  if (typeof document !== 'undefined' && !stylesInjected) {
    const style = document.createElement('style');
    style.textContent = animationStyles;
    document.head.appendChild(style);
    stylesInjected = true;
  }
}

// Hook to observe when element is in view
function useInView(ref, options = {}) {
  const [isInView, setIsInView] = useState(false);
  const { once = true, margin = '-50px' } = options;

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setIsInView(false);
        }
      },
      { rootMargin: margin }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, once, margin]);

  return isInView;
}

// Fade In animation wrapper
export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  direction = null, // 'up', 'down', 'left', 'right'
  className = '',
  once = true
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });

  useEffect(() => {
    injectStyles();
  }, []);

  const animationClass = direction
    ? `animate-fade-in-${direction}`
    : 'animate-fade-in';

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isInView ? undefined : 0,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    >
      <div className={isInView ? animationClass : ''} style={{ animationDelay: `${delay}s`, animationDuration: `${duration}s` }}>
        {children}
      </div>
    </div>
  );
}

// Stagger children animation
export function StaggerContainer({
  children,
  delay = 0,
  staggerDelay = 0.1,
  className = ''
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    injectStyles();
  }, []);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  return (
    <div ref={ref} className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          style: {
            ...child.props.style,
            animationDelay: `${delay + index * staggerDelay}s`,
          },
          'data-animate': hasAnimated ? 'true' : 'false',
        });
      })}
    </div>
  );
}

// Stagger item (child of StaggerContainer)
export function StaggerItem({
  children,
  className = '',
  direction = 'up'
}) {
  useEffect(() => {
    injectStyles();
  }, []);

  const directionClass = {
    up: 'animate-fade-in-up',
    down: 'animate-fade-in-down',
    left: 'animate-fade-in-left',
    right: 'animate-fade-in-right',
    scale: 'animate-scale-in',
  };

  return (
    <div
      className={`stagger-item ${className}`}
      style={{ opacity: 0 }}
      ref={(el) => {
        if (el) {
          const parent = el.closest('[data-animate]');
          if (parent?.getAttribute('data-animate') === 'true') {
            el.classList.add(directionClass[direction] || 'animate-fade-in-up');
            el.style.opacity = '';
          } else {
            // Set up mutation observer to watch for parent animation
            const observer = new MutationObserver(() => {
              if (parent?.getAttribute('data-animate') === 'true') {
                el.classList.add(directionClass[direction] || 'animate-fade-in-up');
                el.style.opacity = '';
                observer.disconnect();
              }
            });
            if (parent) {
              observer.observe(parent, { attributes: true });
            }
          }
        }
      }}
    >
      {children}
    </div>
  );
}

// Scale on hover - now uses CSS only
export function ScaleOnHover({
  children,
  scale = 1.05,
  className = '',
  as = 'div'
}) {
  const Component = as;

  return (
    <Component
      className={`hover-scale ${className}`}
      style={{ '--hover-scale': scale }}
    >
      {children}
    </Component>
  );
}

// Card with hover effects - CSS only
export function AnimatedCard({
  children,
  className = '',
  hoverScale = 1.02,
  hoverY = -5,
  onClick
}) {
  return (
    <div
      className={`hover-lift ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined }}
    >
      {children}
    </div>
  );
}

// Animated button - CSS only
export function AnimatedButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button'
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`hover-scale ${className}`}
    >
      {children}
    </button>
  );
}

// Slide in from side
export function SlideIn({
  children,
  direction = 'left',
  delay = 0,
  className = ''
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    injectStyles();
  }, []);

  const animationClass = `animate-slide-in-${direction}`;

  return (
    <div
      ref={ref}
      className={className}
      style={{ opacity: isInView ? undefined : 0 }}
    >
      <div
        className={isInView ? animationClass : ''}
        style={{ animationDelay: `${delay}s` }}
      >
        {children}
      </div>
    </div>
  );
}

// Parallax scroll effect - simplified CSS version
export function ParallaxScroll({
  children,
  speed = 0.5,
  className = ''
}) {
  return (
    <div className={className} style={{ willChange: 'transform' }}>
      {children}
    </div>
  );
}

// Text reveal animation - simplified CSS version
export function TextReveal({
  text,
  className = '',
  delay = 0,
  staggerDelay = 0.03
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          style={{
            display: 'inline-block',
            opacity: isInView ? 1 : 0,
            transform: isInView ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.3s ease ${delay + index * staggerDelay}s, transform 0.3s ease ${delay + index * staggerDelay}s`,
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

// Pulse animation - CSS only
export function Pulse({
  children,
  className = '',
  scale = 1.05,
  duration = 2
}) {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div
      className={`animate-pulse-custom ${className}`}
      style={{
        '--pulse-scale': scale,
        '--pulse-duration': `${duration}s`
      }}
    >
      {children}
    </div>
  );
}

// Glow effect on hover - CSS only
export function GlowOnHover({
  children,
  className = '',
  glowColor = 'rgba(239, 68, 68, 0.5)'
}) {
  return (
    <div
      className={className}
      style={{
        transition: 'box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 0 30px ${glowColor}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {children}
    </div>
  );
}

// Counter animation - CSS only
export function AnimatedCounter({
  value,
  duration = 2,
  className = ''
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {count}
    </span>
  );
}

// Page transition wrapper - simplified
export function PageTransition({ children }) {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className="animate-fade-in-up">
      {children}
    </div>
  );
}

// Rotate on hover - CSS only
export function RotateOnHover({
  children,
  degrees = 5,
  className = ''
}) {
  return (
    <div
      className={className}
      style={{ transition: 'transform 0.3s ease' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = `rotate(${degrees}deg)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
      }}
    >
      {children}
    </div>
  );
}

// Shake animation - CSS only
export function Shake({
  children,
  trigger = false,
  className = ''
}) {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div className={`${trigger ? 'animate-shake' : ''} ${className}`}>
      {children}
    </div>
  );
}

// Floating animation - CSS only
export function Float({
  children,
  className = '',
  y = 10,
  duration = 3
}) {
  useEffect(() => {
    injectStyles();
  }, []);

  return (
    <div
      className={`animate-float ${className}`}
      style={{
        '--float-y': `${y}px`,
        '--float-duration': `${duration}s`
      }}
    >
      {children}
    </div>
  );
}

// Simple motion div replacement - just renders children with optional className
export function motion({ children, className, ...props }) {
  return <div className={className} {...props}>{children}</div>;
}

// Helper to filter out framer-motion specific props
function filterMotionProps(props) {
  const {
    initial, animate, exit, transition, variants,
    whileHover, whileTap, whileFocus, whileDrag, whileInView,
    drag, dragConstraints, dragElastic, dragMomentum,
    layout, layoutId, onAnimationStart, onAnimationComplete,
    onDrag, onDragStart, onDragEnd, onPan, onPanStart, onPanEnd,
    ...domProps
  } = props;
  return domProps;
}

// Add common element types to motion
motion.div = function MotionDiv({
  children,
  className = '',
  initial,
  animate,
  transition,
  whileHover,
  whileTap,
  variants,
  style,
  ...props
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Convert whileHover to CSS
  const hoverStyles = whileHover ? {
    transform: [
      whileHover.scale ? `scale(${whileHover.scale})` : '',
      whileHover.y ? `translateY(${whileHover.y}px)` : '',
      whileHover.x ? `translateX(${whileHover.x}px)` : '',
      whileHover.rotate ? `rotate(${whileHover.rotate}deg)` : '',
    ].filter(Boolean).join(' ') || undefined,
  } : {};

  // Convert whileTap to CSS
  const tapStyles = whileTap ? {
    transform: [
      whileTap.scale ? `scale(${whileTap.scale})` : '',
      whileTap.y ? `translateY(${whileTap.y}px)` : '',
      whileTap.x ? `translateX(${whileTap.x}px)` : '',
      whileTap.rotate ? `rotate(${whileTap.rotate}deg)` : '',
    ].filter(Boolean).join(' ') || undefined,
  } : {};

  const domProps = filterMotionProps(props);

  return (
    <div
      className={className}
      style={{
        ...style,
        transition: 'transform 0.2s ease, opacity 0.3s ease',
        ...(isPressed ? tapStyles : isHovered ? hoverStyles : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setIsPressed(false); }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      {...domProps}
    >
      {children}
    </div>
  );
};

motion.span = function MotionSpan({ children, className, style, ...props }) {
  const domProps = filterMotionProps(props);
  return <span className={className} style={style} {...domProps}>{children}</span>;
};

motion.button = function MotionButton({
  children,
  className = '',
  whileHover,
  whileTap,
  style,
  ...props
}) {
  const domProps = filterMotionProps(props);
  return (
    <button
      className={`hover-scale ${className}`}
      style={style}
      {...domProps}
    >
      {children}
    </button>
  );
};

motion.a = function MotionA({
  children,
  className = '',
  whileHover,
  whileTap,
  style,
  ...props
}) {
  const domProps = filterMotionProps(props);
  return (
    <a
      className={`hover-scale ${className}`}
      style={style}
      {...domProps}
    >
      {children}
    </a>
  );
};

// AnimatePresence replacement - just renders children
export function AnimatePresence({ children }) {
  return <>{children}</>;
}
