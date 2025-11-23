import { motion } from "framer-motion";
import carOrange from "@/assets/car-orange.png";
import tufastLogo from "@/assets/tufast-logo.png";

const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden hero-gradient">
      {/* Tufast Logo - Large watermark */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.08, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-auto"
      >
        <img 
          src={tufastLogo} 
          alt="TU Fast Racing Team" 
          className="w-full h-auto opacity-100"
        />
      </motion.div>

      {/* Animated Racing Car */}
      <motion.div
        initial={{ x: -200, opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
        }}
        transition={{ 
          duration: 1.5, 
          ease: "easeOut",
        }}
        className="absolute bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-auto"
      >
        <motion.div
          animate={{ 
            y: [0, -8, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative"
        >
          <img 
            src={carOrange} 
            alt="Racing Car" 
            className="w-full h-auto drop-shadow-[0_0_60px_rgba(255,84,0,0.6)]"
          />
          {/* Underglow effect */}
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-primary/40 blur-3xl rounded-full animate-glow-pulse" />
        </motion.div>
      </motion.div>

      {/* Carbon fiber texture overlay */}
      <div className="absolute inset-0 carbon-texture opacity-[0.02]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--primary)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px'
      }} />

      {/* Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
    </div>
  );
};

export default HeroBackground;
