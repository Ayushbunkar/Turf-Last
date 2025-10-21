import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../config/Api';
import BookingCalendar from './BookingCalendar';

export default function TurfDetail() {
  const { id } = useParams();
  const [turf, setTurf] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get(`/api/turfs/${id}`);
        if (!mounted) return;
        setTurf(res.data);
      } catch (e) {
        setError('Failed to load turf');
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error || !turf) return <div className="p-8 text-red-600">{error || 'Turf not found'}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-2xl font-bold">{turf.name}</h2>
        <p className="text-sm text-gray-600">{turf.location}</p>
        <div className="mt-4">Price: <strong>₹{turf.pricePerHour}</strong></div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-3">Availability</h3>
  <BookingCalendar turfId={id} initialDate={new Date().toISOString().slice(0,10)} backendTimesUTC={true} />
      </div>
    </div>
  );
}
