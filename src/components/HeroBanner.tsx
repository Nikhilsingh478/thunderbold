import { motion } from 'framer-motion';

const HeroBanner = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="w-full relative overflow-hidden"
    >
      <img
        src="/banner.webp"
        alt="Get an extra 40% off — Live Now"
        className="w-full block object-cover object-center h-[150px] md:h-auto md:max-h-[260px]"
        loading="eager"
        decoding="async"
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(90deg, rgba(7,7,7,0.35) 0%, transparent 30%, transparent 70%, rgba(7,7,7,0.35) 100%)',
        }}
      />
    </motion.div>
  );
};

export default HeroBanner;
