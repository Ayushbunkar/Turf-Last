import React, { useState } from 'react';
import { motion } from 'framer-motion';

function Contact() {
	const [formData, setFormData] = useState({
		fullname: '',
		email: '',
		feedback: '',
	});

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		// minimal submit handling — replace with API call as needed
		console.log('Contact form submitted:', formData);
		// reset form
		setFormData({ fullname: '', email: '', feedback: '' });
	};

	return (
		<div className="min-h-screen  bg-white">
			<section className="py-16 bg-green-600">
				<div className="container mx-auto px-4">
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center"
					>
						<h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
							Contact Us
						</h1>
						<p className="text-xl text-green-100 max-w-2xl mx-auto">
							Get in touch with our team for any inquiries or support.
						</p>
					</motion.div>
				</div>
			</section>

			<section className="py-16">
				<div className="container mx-auto px-4">
					<div className="max-w-xl mx-auto bg-gray-100 p-8 rounded-lg shadow">
						<h2 className="text-2xl font-semibold text-center text-green-700 mb-6">Send Us a Message</h2>
						<form onSubmit={handleSubmit} className="space-y-4">
							<input
								type="text"
								name="fullname"
								placeholder="Full Name"
								value={formData.fullname}
								onChange={handleChange}
								className="w-full border border-gray-300 rounded p-3"
								required
							/>
							<input
								type="email"
								name="email"
								placeholder="Email Address"
								value={formData.email}
								onChange={handleChange}
								className="w-full border border-gray-300 rounded p-3"
								required
							/>
							<textarea
								name="feedback"
								placeholder="Your Message"
								value={formData.feedback}
								onChange={handleChange}
								rows="5"
								className="w-full border border-gray-300 rounded p-3"
								required
							></textarea>
							<button
								type="submit"
								className="w-full bg-green-600 text-white font-semibold py-3 rounded hover:bg-green-700"
							>
								Submit
							</button>
						</form>
					</div>
				</div>
			</section>
		</div>
	);
}

export default Contact;
