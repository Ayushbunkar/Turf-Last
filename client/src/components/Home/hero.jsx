import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useAnimation } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import footballImg from "../../assets/football.png";

const Hero = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const controls = useAnimation();
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    if (!isMoving) {
      controls.start({
        y: [0, -15, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      });
    } else {
      controls.stop();
    }
  }, [isMoving, controls]);

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <motion.img
          src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=1936&q=80"
          alt="Football turf"
          className="w-full h-full object-cover"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
        />
        <div className="absolute inset-0 bg-black/70" />

        {/* Floating dots */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full bg-green-400 opacity-70"
              initial={{
                x: `${Math.random() * 100}%`,
                y: `${Math.random() * 100}%`,
                scale: Math.random() * 0.4 + 0.4,
              }}
              animate={{
                y: ["0%", "-100%"],
                opacity: [0, 0.7, 0],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-6 lg:px-12 py-20 flex flex-col items-center lg:items-start text-center lg:text-left">
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Book Your Perfect{" "}
          <motion.span
            className="text-green-500 inline-block"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Turf Experience
          </motion.span>
        </motion.h1>

        <motion.p
          className="text-gray-200 text-lg md:text-xl max-w-2xl mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Experience the thrill of playing on premium turfs. Easy booking,
          great facilities, and unforgettable moments await you.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link to="/turfs">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-semibold w-full sm:w-auto"
            >
              Explore Turfs <ArrowRight size={20} />
            </motion.button>
          </Link>

          <Link to="/about">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-black px-6 py-3 rounded-lg border border-gray-200 font-semibold w-full sm:w-auto"
            >
              Learn More
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Floating Football */}
      <motion.div
        className="absolute right-3 bottom-4 
        w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28"
        style={{ x, y }}
        animate={controls}
      >
        <img
          src={footballImg}
          alt="Football"
          className="w-full h-full object-contain rounded-full border border-white shadow-lg"
        />
      </motion.div>
    </div>
  );
};

export default Hero;
