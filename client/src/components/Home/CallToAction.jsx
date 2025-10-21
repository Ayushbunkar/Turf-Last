import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { CalendarIcon } from "lucide-react";

const CallToAction = () => {
  return (
    <section className="relative overflow-hidden py-12 sm:py-16 md:py-20 bg-gradient-to-r from-green-600 to-green-700 text-white">
      {/* Subtle Background Glow Animation */}
      <motion.div
        className="absolute top-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0.4, 0.6] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-green-400/20 rounded-full blur-3xl"
        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.3, 0.5] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          
          {/* Text Block */}
          <motion.div
            className="text-center md:text-left max-w-xl"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-3 md:mb-5">
              Ready to Play?
            </h2>
            <p className="text-green-100 text-base sm:text-lg md:text-xl leading-relaxed">
              Book your turf now and experience top-quality playing conditions.
              Enjoy special discounts on weekday bookings!
            </p>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex justify-center md:justify-end w-full md:w-auto"
          >
            <Link to="/turfs" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-green-700 font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden"
              >
                {/* Glow effect */}
                <span className="absolute inset-0 bg-green-200/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></span>

                <CalendarIcon size={20} />
                <span className="relative z-10">Book a Turf Now</span>
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
