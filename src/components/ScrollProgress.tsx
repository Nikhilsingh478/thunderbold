import { motion, useScroll, useTransform } from 'framer-motion';

const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <motion.div
      className="fixed top-0 left-0 h-px"
      style={{
        width,
        zIndex: 9997,
        background: 'linear-gradient(90deg, #7a6210, #d4aa30, #b8941a)',
      }}
    />
  );
};

export default ScrollProgress;
