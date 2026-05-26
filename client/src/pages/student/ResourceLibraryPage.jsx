import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ResourceLibraryPage() {
  const [resources, setResources] = useState([]);
  const [filter, setFilter] = useState('title');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, [filter]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/resource-library', {
        params: { type: filter === 'title' ? 'title' : 'specialization' }
      });
      setResources(data.data);
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Resource Library</h1>

      <div className="mb-6 flex gap-4">
        <button
          onClick={() => setFilter('title')}
          className={`px-4 py-2 rounded ${filter === 'title' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          FYP Titles
        </button>
        <button
          onClick={() => setFilter('specialization')}
          className={`px-4 py-2 rounded ${filter === 'specialization' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          Specializations
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No resources available yet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resource => (
            <div key={resource.id} className="border rounded-lg p-4 hover:shadow-lg transition">
              <h3 className="font-bold text-lg">{resource.title}</h3>
              {resource.year && <p className="text-sm text-gray-600">Year: {resource.year}</p>}
              {resource.specialization && <p className="text-sm text-gray-600">Specialization: {resource.specialization}</p>}
              {resource.description && <p className="text-sm mt-2">{resource.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
