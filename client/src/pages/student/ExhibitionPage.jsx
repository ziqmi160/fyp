import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ExhibitionRePage() {
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const fetchExhibitions = async () => {
    try {
      const { data } = await api.get('/api/exhibitions');
      setExhibitions(data.data);
    } catch (err) {
      toast.error('Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (exhibitionId) => {
    try {
      await api.post(`/api/exhibitions/${exhibitionId}/register`);
      toast.success('Registered for exhibition');
      setRegistered([...registered, exhibitionId]);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    }
  };

  const handleCheckIn = async (exhibitionId) => {
    try {
      await api.post(`/api/exhibitions/${exhibitionId}/check-in`);
      toast.success('Check-in recorded');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">FYP Exhibitions</h1>

      {exhibitions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No exhibitions scheduled yet</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {exhibitions.map(exhibition => (
            <div key={exhibition.id} className="border rounded-lg p-6 hover:shadow-lg transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{exhibition.title}</h3>
                  <p className="text-gray-600">{exhibition.venue}</p>
                </div>
                <button
                  onClick={() => setSelectedExhibition(exhibition.id)}
                  className="px-4 py-2 bg-primary text-white rounded font-medium"
                >
                  Details
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Date</p>
                  <p className="font-medium">{new Date(exhibition.event_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Time</p>
                  <p className="font-medium">{exhibition.start_time || 'TBD'}</p>
                </div>
              </div>

              {exhibition.briefing_announced && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                  <p className="text-sm font-medium mb-1">📢 Briefing Available</p>
                  <p className="text-sm">{exhibition.briefing_content}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!registered.includes(exhibition.id) ? (
                  <button
                    onClick={() => handleRegister(exhibition.id)}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded font-medium"
                  >
                    Register
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleCheckIn(exhibition.id)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium"
                    >
                      Check In
                    </button>
                    <span className="px-4 py-2 bg-green-100 text-green-800 rounded font-medium">
                      ✓ Registered
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
