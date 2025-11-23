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

      {/* Animated Racing Car - Subtle Background */}
      <motion.div
        initial={{ x: "100vw" }}
        animate={{ 
          x: "-100%",
        }}
        transition={{ 
          duration: 14,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop"
        }}
        className="absolute bottom-20 w-[500px] h-auto"
        style={{ zIndex: -2 }}
      >
        <div className="relative opacity-[0.08]">
          <img 
            src={carOrange} 
            alt="Racing Car" 
            className="w-full h-auto"
            style={{ mixBlendMode: "soft-light" }}
          />
          {/* Subtle dust trail */}
          <div className="absolute top-1/2 -left-20 w-40 h-2 bg-gradient-to-r from-transparent via-primary/20 to-transparent blur-xl" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/3 h-6 bg-primary/10 blur-2xl rounded-full" />
        </div>
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
