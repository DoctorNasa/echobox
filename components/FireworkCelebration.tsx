import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FireworkCelebrationProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function FireworkCelebration({ isActive, onComplete }: FireworkCelebrationProps) {
  // Firework particle configuration
  const fireworkColors = [
    '#FFD700', // Gold
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#FFA07A', // Light Salmon
  ];

  // Create multiple firework bursts
  const fireworkBursts = [
    { delay: 0, x: '20%', y: '30%', color: fireworkColors[0] },
    { delay: 0.3, x: '80%', y: '25%', color: fireworkColors[1] },
    { delay: 0.6, x: '50%', y: '40%', color: fireworkColors[2] },
    { delay: 0.9, x: '30%', y: '60%', color: fireworkColors[3] },
    { delay: 1.2, x: '70%', y: '55%', color: fireworkColors[4] },
  ];

  // Generate particles for each firework
  const generateFireworkParticles = (centerX: string, centerY: string, color: string, burstIndex: number) => {
    const particles = [];
    const particleCount = 16; // Number of particles per firework
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i * 360) / particleCount;
      const distance = 60 + Math.random() * 40; // Random distance for variety
      const particleDelay = Math.random() * 0.1; // Small random delay for stagger effect
      
      particles.push(
        <motion.div
          key={`firework-${burstIndex}-particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            backgroundColor: color,
            left: centerX,
            top: centerY,
            boxShadow: `0 0 6px ${color}`,
          }}
          initial={{
            scale: 0,
            x: 0,
            y: 0,
            opacity: 1,
          }}
          animate={{
            scale: [0, 1, 0.5, 0],
            x: Math.cos((angle * Math.PI) / 180) * distance,
            y: Math.sin((angle * Math.PI) / 180) * distance + 20, // Add gravity effect
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: particleDelay,
            ease: "easeOut",
          }}
        />
      );
    }
    return particles;
  };

  // Shooting star particles
  const shootingStars = Array.from({ length: 3 }, (_, i) => (
    <motion.div
      key={`star-${i}`}
      className="absolute w-1 h-1 bg-yellow-300 rounded-full"
      style={{
        left: `${10 + i * 30}%`,
        top: '10%',
        boxShadow: '0 0 8px #FFD700',
      }}
      initial={{
        scale: 0,
        x: 0,
        y: 0,
        opacity: 0,
      }}
      animate={{
        scale: [0, 1, 0],
        x: 200 + i * 50,
        y: 150 + i * 30,
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        delay: 0.5 + i * 0.3,
        ease: "easeOut",
      }}
    />
  ));

  // Screen flash effect
  const screenFlash = (
    <motion.div
      className="fixed inset-0 bg-white/30 pointer-events-none z-50"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 0.6, 0, 0.4, 0, 0.3, 0],
      }}
      transition={{
        duration: 2,
        times: [0, 0.1, 0.2, 0.4, 0.5, 0.7, 1],
      }}
    />
  );

  // Golden sparkle rain
  const sparkleRain = Array.from({ length: 12 }, (_, i) => (
    <motion.div
      key={`sparkle-${i}`}
      className="absolute w-2 h-2 bg-yellow-400 rounded-full"
      style={{
        left: `${15 + i * 7}%`,
        top: '0%',
        boxShadow: '0 0 4px #FBBF24',
      }}
      initial={{
        scale: 0,
        y: -20,
        opacity: 0,
        rotate: 0,
      }}
      animate={{
        scale: [0, 1, 0.5],
        y: [0, 400, 500],
        opacity: [0, 1, 0],
        rotate: [0, 360, 720],
      }}
      transition={{
        duration: 3,
        delay: 1.5 + i * 0.1,
        ease: "easeIn",
      }}
    />
  ));

  // Expanding rings of light
  const lightRings = Array.from({ length: 3 }, (_, i) => (
    <motion.div
      key={`ring-${i}`}
      className="absolute border-2 border-yellow-400/50 rounded-full"
      style={{
        left: '50%',
        top: '50%',
        width: '20px',
        height: '20px',
        marginLeft: '-10px',
        marginTop: '-10px',
      }}
      initial={{
        scale: 0,
        opacity: 1,
      }}
      animate={{
        scale: [0, 8, 12],
        opacity: [0.8, 0.3, 0],
      }}
      transition={{
        duration: 2.5,
        delay: 0.2 + i * 0.3,
        ease: "easeOut",
      }}
    />
  ));

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
          {/* Screen flash */}
          {screenFlash}
          
          {/* Expanding light rings */}
          {lightRings}
          
          {/* Main firework bursts */}
          {fireworkBursts.map((burst, index) => (
            <motion.div
              key={`burst-${index}`}
              className="absolute w-full h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: burst.delay }}
            >
              {/* Central flash */}
              <motion.div
                className="absolute w-4 h-4 rounded-full"
                style={{
                  left: burst.x,
                  top: burst.y,
                  backgroundColor: burst.color,
                  boxShadow: `0 0 20px ${burst.color}`,
                  marginLeft: '-8px',
                  marginTop: '-8px',
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 3, 1, 0],
                  opacity: [0, 1, 0.7, 0],
                }}
                transition={{
                  duration: 1,
                  ease: "easeOut",
                }}
              />
              
              {/* Particles */}
              {generateFireworkParticles(burst.x, burst.y, burst.color, index)}
            </motion.div>
          ))}
          
          {/* Shooting stars */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {shootingStars}
          </motion.div>
          
          {/* Sparkle rain */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {sparkleRain}
          </motion.div>
          
          {/* Success text overlay */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            initial={{
              scale: 0,
              opacity: 0,
              y: 50,
            }}
            animate={{
              scale: [0, 1.2, 1],
              opacity: [0, 1, 0.8],
              y: [50, 0, -20],
            }}
            exit={{
              scale: 0,
              opacity: 0,
              y: -50,
            }}
            transition={{
              duration: 3,
              delay: 1,
              ease: "easeOut",
            }}
          >
            <div className="text-center">
              <div className="text-4xl mb-2">🎉</div>
              <div className="text-2xl font-bold text-yellow-600 drop-shadow-lg">
                Gift Claimed!
              </div>
              <div className="text-lg text-yellow-500 drop-shadow-md">
                Celebration Time!
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}