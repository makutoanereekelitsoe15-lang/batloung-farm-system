import { useState, useEffect } from 'react';
import { fruitService } from '../services/fruits';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

const emptyFruitForm = {
  fruit_name: '',
  description: '',
  status: 'ACTIVE',
};

export default function Fruits() {
  const [fruits, setFruits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyFruitForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadFruits();
  }, []);

  async function loadFruits() {
    setLoading(true);
    try {
      const response = await fruitService.getAll();
      setFruits(response.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Could not load fruits catalogue.' });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData(emptyFruitForm);
    setIsModalOpen(true);
  }

  function handleOpenEdit(fruit) {
    setEditingId(fruit.fruit_id);
    setFormData({
      fruit_name: fruit.fruit_name,
      description: fruit.description,
      status: fruit.status,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      if (editingId) {
        await fruitService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Fruit type updated successfully.' });
      } else {
        await fruitService.create(formData);
        setAlert({ type: 'success', message: 'New fruit registered in catalogue.' });
      }
      setIsModalOpen(false);
      loadFruits();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save fruit.' });
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'fruit_name', label: 'Fruit Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      render: (fruit) => <StatusBadge status={fruit.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (fruit) => (
        <button
          className="btn btn-ghost btn-small"
          onClick={() => handleOpenEdit(fruit)}
        >
          Edit
        </button>
      ),
    },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Fruit Catalogue</h2>
          <p className="muted">Manage fruit varieties distributed by Batloung Farm (Apples, Bananas, Oranges, etc.)</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register New Fruit
        </button>
      </header>

      {alert.message && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })}
        />
      )}

      <div className="card">
        <DataTable
          columns={columns}
          rows={fruits}
          loading={loading}
          emptyText="No fruits registered. Click 'Register New Fruit' above."
        />
      </div>

      {isModalOpen && (
        <Modal
          title={editingId ? 'Edit Fruit Type' : 'Register New Fruit'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="full">
              Fruit Name
              <input
                type="text"
                required
                placeholder="e.g. Fuji Apples or Cavendish Bananas"
                value={formData.fruit_name}
                onChange={(e) => setFormData({ ...formData, fruit_name: e.target.value })}
              />
            </label>

            <label className="full">
              Description
              <textarea
                rows={3}
                placeholder="Brief description of the fruit variety, quality, origin..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </label>

            <label className="full">
              Status
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE (Available for sale and purchase)</option>
                <option value="INACTIVE">INACTIVE (Temporarily discontinued)</option>
              </select>
            </label>

            <div className="full form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Fruit' : 'Save Fruit'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
