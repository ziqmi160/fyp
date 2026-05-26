import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function ResourceLibraryManagementPage() {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState({ title: '', year: '', specialization: '', type: 'title', description: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const { data } = await api.get('/api/resource-library');
      setResources(data.data);
    } catch (err) {
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.type) {
      toast.error('Title and type are required');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        const { data } = await api.put(`/api/resource-library/${editingId}`, form);
        setResources(resources.map(r => r.id === editingId ? data.data : r));
        toast.success('Resource updated');
        setEditingId(null);
      } else {
        const { data } = await api.post('/api/resource-library', form);
        setResources([data.data, ...resources]);
        toast.success('Resource added');
      }
      setForm({ title: '', year: '', specialization: '', type: 'title', description: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save resource');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/api/resource-library/${id}`);
      setResources(resources.filter(r => r.id !== id));
      toast.success('Resource deleted');
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const handleEdit = (resource) => {
    setForm(resource);
    setEditingId(resource.id);
  };

  if (loading) return <div className="p-6 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Resource Library Management</h1>

      <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Resource' : 'Add New Resource'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="px-4 py-2 border rounded"
          />
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="px-4 py-2 border rounded"
          >
            <option value="title">FYP Title</option>
            <option value="specialization">Specialization</option>
          </select>
          <input
            type="number"
            value={form.year}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            placeholder="Year"
            className="px-4 py-2 border rounded"
          />
          <input
            type="text"
            value={form.specialization}
            onChange={(e) => setForm({ ...form, specialization: e.target.value })}
            placeholder="Specialization"
            className="px-4 py-2 border rounded"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Description"
          rows="3"
          className="w-full px-4 py-2 border rounded mb-4"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-primary text-white rounded font-medium disabled:opacity-50"
          >
            {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm({ title: '', year: '', specialization: '', type: 'title', description: '' });
              }}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4">
        {resources.map(resource => (
          <div key={resource.id} className="border rounded-lg p-4 flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg">{resource.title}</h3>
              <div className="flex gap-4 text-sm text-gray-600 mt-1">
                <span>{resource.type === 'title' ? '📚 FYP Title' : '🎓 Specialization'}</span>
                {resource.year && <span>Year: {resource.year}</span>}
                {resource.specialization && <span>{resource.specialization}</span>}
              </div>
              {resource.description && <p className="text-sm mt-2">{resource.description}</p>}
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleEdit(resource)}
                className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(resource.id)}
                className="px-4 py-2 bg-red-500 text-white rounded text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
