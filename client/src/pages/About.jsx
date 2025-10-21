import React from "react";
import { motion } from "framer-motion";
import team1 from "../assets/team1.jpg";
import team2 from "../assets/team2.jpg";
import team3 from "../assets/team3.jpg";

const About = () => {

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen  bg-white text-gray-800">
      {/* Hero Section */}
      <section className="bg-green-600 text-white py-16 text-center px-4">
        <motion.h1
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          transition={{ duration: 0.6 }}
          className="text-5xl font-bold mb-3"
        >
          About Us
        </motion.h1>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto text-lg"
        >
          Our journey to make turf booking easy and enjoyable for every sports
          lover.
        </motion.p>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-gray-100 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            transition={{ duration: 0.6 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Our Mission
            </h2>
            <p>
              To make turf discovery and booking simple, fast, and fun for every
              sports enthusiast.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow"
          >
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Our Vision
            </h2>
            <p>
              To build a community where everyone can access world-class playing
              spaces anytime, anywhere.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 text-center px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold mb-10"
        >
          Meet the <span className="text-green-600">Team</span>
        </motion.h2>

        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {[team1, team2, team3].map((img, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white rounded-xl shadow p-4"
            >
              <img
                src={img}
                alt="Team"
                className="w-full h-56 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold">Team Member {index + 1}</h3>
              <p className="text-gray-600 text-sm">
                Role: Developer / Designer / Strategist
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Journey / Timeline */}
      <section className="py-16 bg-gray-50 px-4">
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          transition={{ duration: 0.6 }}
          className="text-3xl font-bold text-center mb-12"
        >
          Our <span className="text-green-600">Journey</span>
        </motion.h2>

        <div className="max-w-3xl mx-auto border-l-4 border-green-600 pl-6 space-y-8">
          {[
            {
              year: "2023",
              text: "Started the idea after facing turf booking problems every weekend.",
            },
            {
              year: "2024",
              text: "Launched our beta version with 10+ turfs and hundreds of happy users.",
            },
            {
              year: "2025",
              text: "Expanded to 4 cities with thousands of users and new exciting features.",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className="bg-white p-4 rounded shadow relative"
            >
              <span className="absolute -left-7 top-4 w-6 h-6 bg-green-600 rounded-full border-4 border-white"></span>
              <h4 className="text-xl font-semibold text-green-700">
                {item.year}
              </h4>
              <p>{item.text}</p>
            </motion.div>
          ))}
        </div>

        {/* Story Section */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-20"
        >
          <h2 className="text-3xl font-bold mb-4">
            Our <span className="text-green-600">Story</span>
          </h2>
          <p className="max-w-3xl mx-auto text-gray-700">
            What started as a simple frustration to find and book football turfs
            turned into a mission. We created this platform so players can find
            nearby grounds, book instantly, and spend more time playing instead
            of searching. From casual players to professionals — we’re here for
            everyone who loves the game.
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default About;
