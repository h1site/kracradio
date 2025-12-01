'use client';
// src/components/animations/index.jsx
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

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
  const isInView = useInView(ref, { once, margin: '-50px' });

  const directionOffset = {
    up: { y: 40 },
    down: { y: -40 },
    left: { x: 40 },
    right: { x: -40 },
  };

  const initial = {
    opacity: 0,
    ...(direction ? directionOffset[direction] : {}),
  };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
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
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (isInView && !hasAnimated) {
      setHasAnimated(true);
    }
  }, [isInView, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={hasAnimated ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            delayChildren: delay,
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger item (child of StaggerContainer)
export function StaggerItem({
  children,
  className = '',
  direction = 'up'
}) {
  const directionVariants = {
    up: { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } },
    down: { hidden: { opacity: 0, y: -30 }, visible: { opacity: 1, y: 0 } },
    left: { hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } },
    right: { hidden: { opacity: 0, x: -30 }, visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.8 }, visible: { opacity: 1, scale: 1 } },
  };

  return (
    <motion.div
      variants={directionVariants[direction]}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Scale on hover
export function ScaleOnHover({
  children,
  scale = 1.05,
  className = '',
  as = 'div'
}) {
  const Component = motion[as] || motion.div;

  return (
    <Component
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </Component>
  );
}

// Card with hover effects
export function AnimatedCard({
  children,
  className = '',
  hoverScale = 1.02,
  hoverY = -5,
  onClick
}) {
  return (
    <motion.div
      whileHover={{
        scale: hoverScale,
        y: hoverY,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// Animated button
export function AnimatedButton({
  children,
  className = '',
  onClick,
  disabled = false,
  type = 'button'
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.button>
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

  const variants = {
    left: { initial: { x: -100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    right: { initial: { x: 100, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    up: { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
    down: { initial: { y: -100, opacity: 0 }, animate: { y: 0, opacity: 1 } },
  };

  return (
    <motion.div
      ref={ref}
      initial={variants[direction].initial}
      animate={isInView ? variants[direction].animate : variants[direction].initial}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Parallax scroll effect
export function ParallaxScroll({
  children,
  speed = 0.5,
  className = ''
}) {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      style={{ willChange: 'transform' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Text reveal animation (letter by letter)
export function TextReveal({
  text,
  className = '',
  delay = 0,
  staggerDelay = 0.03
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: delay,
        staggerChildren: staggerDelay,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.span
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
      aria-label={text}
    >
      {text.split('').map((char, index) => (
        <motion.span
          key={index}
          variants={letterVariants}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Pulse animation
export function Pulse({
  children,
  className = '',
  scale = 1.05,
  duration = 2
}) {
  return (
    <motion.div
      animate={{
        scale: [1, scale, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Glow effect on hover
export function GlowOnHover({
  children,
  className = '',
  glowColor = 'rgba(239, 68, 68, 0.5)'
}) {
  return (
    <motion.div
      whileHover={{
        boxShadow: `0 0 30px ${glowColor}`,
      }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Counter animation
export function AnimatedCounter({
  value,
  duration = 2,
  className = ''
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        transition: { duration: 0.5 },
      });
    }
  }, [isInView, controls]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={controls}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
      >
        {isInView && (
          <CountUp end={value} duration={duration} />
        )}
      </motion.span>
    </motion.span>
  );
}

// Simple count up component
function CountUp({ end, duration }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);

      setCount(Math.floor(progress * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
}

// Page transition wrapper
export function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

// Rotate on hover
export function RotateOnHover({
  children,
  degrees = 5,
  className = ''
}) {
  return (
    <motion.div
      whileHover={{ rotate: degrees }}
      transition={{ type: 'spring', stiffness: 300 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Shake animation (for errors, etc.)
export function Shake({
  children,
  trigger = false,
  className = ''
}) {
  return (
    <motion.div
      animate={trigger ? {
        x: [0, -10, 10, -10, 10, 0],
        transition: { duration: 0.5 }
      } : {}}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Floating animation
export function Float({
  children,
  className = '',
  y = 10,
  duration = 3
}) {
  return (
    <motion.div
      animate={{
        y: [-y, y, -y],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Export AnimatePresence for page transitions
export { AnimatePresence, motion };
