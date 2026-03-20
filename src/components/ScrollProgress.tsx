import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <motion.div
      className="fixed top-0 left-0 h-px bg-sv"
      style={{ width, zIndex: 9997 }}
    />
  );
};

export default ScrollProgress;
