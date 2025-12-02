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

      {/* Centered Racing Car - Subtle idle animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: [0.06, 0.08, 0.06],
          x: ["-50%", "-48%", "-52%", "-50%"],
          y: ["-50%", "-48%", "-52%", "-50%"],
          scale: [1, 1.02, 1, 1.03, 1]
        }}
        transition={{ 
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
          times: [0, 0.25, 0.5, 0.75, 1]
        }}
        className="absolute top-1/2 left-1/2 w-[600px] h-auto pointer-events-none"
        style={{ 
          zIndex: -2,
          filter: "blur(6px)",
          mixBlendMode: "soft-light"
        }}
      >
        <img 
          src={carOrange} 
          alt="Racing Car" 
          className="w-full h-auto"
        />
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
