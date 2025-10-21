import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { StarIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

const testimonials = [
  { name: 'Lalit Bhai', role: 'Weekend Cricketer', image: 'https://randomuser.me/api/portraits/men/80.jpg', rating: 5, text: 'TurfTime makes weekend matches hassle-free. Booking is seamless and the turf quality is top-notch!' },
  { name: 'Shreyaa Sharma', role: 'College Footballer', image: 'https://randomuser.me/api/portraits/women/79.jpg', rating: 5, text: 'Our college team always uses TurfTime for booking matches. It’s reliable and fast!' },
  { name: 'Ankit Verma', role: 'Fitness Enthusiast', image: 'https://randomuser.me/api/portraits/men/15.jpg', rating: 4, text: 'Great turfs and smooth booking experience. I love playing night matches here.' },
  { name: 'Sneha Patel', role: 'Amateur Goalkeeper', image: 'https://randomuser.me/api/portraits/women/83.jpg', rating: 5, text: 'TurfTime is the best app for booking practice sessions. Highly recommended!' },
  { name: 'Rohit Iyer', role: 'Corporate Team Player', image: 'https://randomuser.me/api/portraits/men/92.jpg', rating: 5, text: 'My colleagues and I book our Friday matches on TurfTime. Smooth interface and great support.' },
  { name: 'Priya Nair', role: 'Yoga Trainer', image: 'https://randomuser.me/api/portraits/women/71.jpg', rating: 4, text: 'Clean facilities, on-time slot access, and friendly staff. Love it!' },
];

const Testimonials = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = () => { setDirection(1); setCurrentIndex((p) => (p + 1) % testimonials.length); };
  const prev = () => { setDirection(-1); setCurrentIndex((p) => (p === 0 ? testimonials.length - 1 : p - 1)); };

  useEffect(() => { const timer = setInterval(next, 6000); return () => clearInterval(timer); }, []);

  const variants = {
    hidden: d => ({ x: d > 0 ? 150 : -150, opacity: 0 }),
    visible: { x: 0, opacity: 1, transition: { duration: 0.6 } },
    exit: d => ({ x: d > 0 ? -150 : 150, opacity: 0, transition: { duration: 0.6 } })
  };

  return (
    <section ref={ref} className="py-20 bg-[#f9fafb] overflow-hidden">
      <div className="container mx-auto px-4">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-3">
            What Our <span className="text-green-600">Players Say</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">Real stories from real people who love playing with TurfTime.</p>
        </motion.div>

        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              whileHover={{ scale: 1.03 }}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl border border-gray-100"
            >
              <div className="flex items-center gap-4 mb-3">
                <img src={t.image} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                <div>
                  <h4 className="font-semibold">{t.name}</h4>
                  <p className="text-sm text-gray-500">{t.role}</p>
                </div>
              </div>
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, j) => (
                  <StarIcon key={j} size={18} className={j < t.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                ))}
              </div>
              <p className="text-gray-700 italic">"{t.text}"</p>
            </motion.div>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden relative h-[360px] mt-8">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="absolute inset-0 bg-white p-6 rounded-xl shadow-lg border border-gray-100 text-center"
            >
              <div className="flex flex-col items-center mb-4">
                <img src={testimonials[currentIndex].image} alt={testimonials[currentIndex].name} className="w-16 h-16 rounded-full object-cover" />
                <h4 className="font-semibold mt-3">{testimonials[currentIndex].name}</h4>
                <p className="text-sm text-gray-500">{testimonials[currentIndex].role}</p>
              </div>
              <div className="flex justify-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} size={18} className={i < testimonials[currentIndex].rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} />
                ))}
              </div>
              <p className="text-gray-700 italic">"{testimonials[currentIndex].text}"</p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-6">
            <button onClick={prev} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
              <ChevronLeftIcon size={20} />
            </button>
            <button onClick={next} className="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
              <ChevronRightIcon size={20} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
