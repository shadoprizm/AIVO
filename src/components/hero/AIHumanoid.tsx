import { motion } from 'framer-motion';

export function AIHumanoid() {
  return (
    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[500px] h-[600px] pointer-events-none hidden lg:block">
      {/* Robot image */}
      <motion.div
        className="relative w-full h-full"
        initial={{ opacity: 0, x: -100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <motion.img
          src="/generated-ai-robot.png"
          alt="AI Robot Assistant"
          className="w-full h-full object-contain"
          style={{
            opacity: 0.8,
            filter: 'drop-shadow(0 0 30px rgba(59, 130, 246, 0.3))'
          }}
          animate={{
            y: [0, -10, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Glow effect behind the robot */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
          }}
        />

        {/* Energy particles flowing from pointing hand toward CTA */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: '60%', // Adjusted for left-side positioning, pointing right
              top: '35%',
              width: 6,
              height: 6,
              background: 'rgba(96, 165, 250, 0.8)',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
            }}
            animate={{
              x: [0, 150, 300], // Flowing right
              y: [0, 30, 60],
              opacity: [1, 0.6, 0],
              scale: [1, 0.8, 0.4],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Subtle pulse at the fingertip */}
        <motion.div
          className="absolute rounded-full"
          style={{
            left: '58%', // Adjusted for left-side positioning
            top: '33%',
            width: 12,
            height: 12,
            background: 'rgba(59, 130, 246, 0.6)',
            boxShadow: '0 0 20px rgba(59, 130, 246, 0.8)',
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
        />
      </motion.div>
    </div>
  );
}
