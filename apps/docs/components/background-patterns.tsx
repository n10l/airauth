'use client';

import { motion } from 'framer-motion';

export function BackgroundPatterns() {
  return (
    <div className='fixed inset-0 overflow-hidden pointer-events-none'>
      {/* Animated Grid Pattern */}
      <svg className='absolute inset-0 w-full h-full' xmlns='http://www.w3.org/2000/svg'>
        <defs>
          <pattern id='grid' width='40' height='40' patternUnits='userSpaceOnUse'>
            <path
              d='M 40 0 L 0 0 0 40'
              fill='none'
              stroke='currentColor'
              strokeWidth='0.5'
              className='text-orange-200 dark:text-orange-900 opacity-20'
            />
          </pattern>

          {/* Gradient Definitions */}
          <linearGradient id='grad1' x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='#ea580c' stopOpacity='0.1'>
              <animate
                attributeName='stop-color'
                values='#ea580c;#dc2626;#ea580c'
                dur='10s'
                repeatCount='indefinite'
              />
            </stop>
            <stop offset='100%' stopColor='#dc2626' stopOpacity='0.1'>
              <animate
                attributeName='stop-color'
                values='#dc2626;#ea580c;#dc2626'
                dur='10s'
                repeatCount='indefinite'
              />
            </stop>
          </linearGradient>

          <radialGradient id='grad2'>
            <stop offset='0%' stopColor='#14b8a6' stopOpacity='0.2' />
            <stop offset='100%' stopColor='#f97316' stopOpacity='0' />
          </radialGradient>
        </defs>

        <rect width='100%' height='100%' fill='url(#grid)' />
      </svg>

      {/* Animated Orbs */}
      <motion.div
        className='absolute top-1/4 left-1/4 w-96 h-96 rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(234, 88, 12, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className='absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full'
        style={{
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => {
        // Use deterministic values based on index instead of Math.random()
        const left = (i * 5 + 10) % 100;
        const top = (i * 7 + 15) % 100;
        const opacity = 0.2 + (i % 5) * 0.1;
        const xMovement = ((i % 3) - 1) * 20;
        const duration = 10 + (i % 4) * 2.5;
        const delay = i % 5;

        return (
          <motion.div
            key={i}
            className='absolute w-1 h-1 bg-orange-400 dark:bg-orange-600 rounded-full'
            style={{
              left: `${left}%`,
              top: `${top}%`,
              opacity: opacity,
            }}
            animate={{
              y: [-20, -100, -20],
              x: [0, xMovement, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: delay,
            }}
          />
        );
      })}

      {/* Gradient Mesh */}
      <div className='absolute inset-0'>
        <div className='absolute top-0 left-1/3 w-1/3 h-1/3 bg-gradient-to-br from-orange-500/5 to-transparent rounded-full blur-3xl' />
        <div className='absolute bottom-0 right-1/3 w-1/3 h-1/3 bg-gradient-to-tl from-red-500/5 to-transparent rounded-full blur-3xl' />
        <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-r from-amber-500/5 via-orange-500/5 to-red-500/5 rounded-full blur-3xl' />
      </div>

      {/* Animated Lines */}
      <svg className='absolute inset-0 w-full h-full' xmlns='http://www.w3.org/2000/svg'>
        <motion.line
          x1='0'
          y1='50%'
          x2='100%'
          y2='50%'
          stroke='url(#grad1)'
          strokeWidth='1'
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
          }}
        />
        <motion.line
          x1='50%'
          y1='0'
          x2='50%'
          y2='100%'
          stroke='url(#grad1)'
          strokeWidth='1'
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: 1.5,
          }}
        />
      </svg>
    </div>
  );
}
