import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  ShieldIcon,
  TagIcon,
  UsersIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon
} from 'lucide-react';

const featuresList = [
  { icon: <CalendarIcon size={36} className="text-green-600" />, title: 'Easy Booking', description: 'Book your preferred turf in just a few clicks, anytime.' },
  { icon: <MapPinIcon size={36} className="text-green-600" />, title: 'Multiple Locations', description: 'Find turfs near you at multiple convenient spots.' },
  { icon: <ClockIcon size={36} className="text-green-600" />, title: 'Flexible Hours', description: 'Morning or night — play whenever suits you best.' },
  { icon: <UsersIcon size={36} className="text-green-600" />, title: 'Various Formats', description: '5-a-side, 7-a-side, or full pitch — all available.' },
  { icon: <ShieldIcon size={36} className="text-green-600" />, title: 'Premium Facilities', description: 'Enjoy top turf quality and premium amenities.' },
  { icon: <TagIcon size={36} className="text-green-600" />, title: 'Best Prices', description: 'Competitive rates and discounts for regular players.' },
  { icon: <ShieldIcon size={36} className="text-green-600" />, title: 'Secure Payments', description: 'Safe, encrypted, and hassle-free transactions.' },
  { icon: <UsersIcon size={36} className="text-green-600" />, title: 'Community Events', description: 'Join matches, tournaments & local meetups.' },
  { icon: <TrophyIcon size={36} className="text-green-600" />, title: 'Tournaments & Rewards', description: 'Win exciting prizes and recognition.' }
];

const Features = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px 0px' });
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % featuresList.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev === 0 ? featuresList.length - 1 : prev - 1));

  useEffect(() => {
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-16 sm:py-20 bg-white" ref={ref}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-green-600">TurfTime</span>?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
            Enjoy a premium turf booking experience with seamless service and great facilities.
          </p>
        </motion.div>

        {/* ✅ Desktop / Tablet Grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuresList.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.04 }}
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* ✅ Mobile Carousel */}
        <div className="md:hidden relative mt-6 flex flex-col items-center">
          <div className="overflow-hidden w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="bg-white p-6 rounded-xl shadow-md border border-gray-100 text-center"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4 }}
              >
                <div className="flex justify-center mb-4">{featuresList[currentIndex].icon}</div>
                <h3 className="text-lg font-semibold mb-2">{featuresList[currentIndex].title}</h3>
                <p className="text-gray-600 text-sm">{featuresList[currentIndex].description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-center mt-4 items-center gap-4">
            <button onClick={prevSlide} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200">
              <ChevronLeftIcon size={20} />
            </button>

            <div className="flex gap-1">
              {featuresList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full ${
                    currentIndex === i ? 'bg-green-600' : 'bg-gray-300'
                  } transition-all`}
                />
              ))}
            </div>

            <button onClick={nextSlide} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200">
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
