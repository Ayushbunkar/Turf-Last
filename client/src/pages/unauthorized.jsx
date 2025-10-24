import React from "react";
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
	const navigate = useNavigate();
	let user = null;
	try {
		user = JSON.parse(localStorage.getItem('user'));
	} catch (e) {
		user = null;
	}

	const role = user?.role || 'Guest';

	return (
		<div className="max-w-xl mx-auto text-center p-8">
			<h1 className="text-2xl font-bold mb-2">Access denied</h1>
			<p className="text-gray-600 mb-4">You are signed in as <strong>{role}</strong> and don't have permission to view this page.</p>
			<p className="text-sm text-gray-500 mb-6">If you believe this is an error, contact your administrator or request elevated access.</p>
			<div className="flex justify-center gap-3">
				<button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 rounded">Go back</button>
				<button onClick={() => navigate(role && role.toLowerCase().includes('turf') ? '/dashboard/turfadmin' : '/dashboard')} className="px-4 py-2 bg-blue-600 text-white rounded">Go to Dashboard</button>
				<button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }} className="px-4 py-2 bg-red-600 text-white rounded">Logout</button>
			</div>
		</div>
	);
};

export default Unauthorized;
