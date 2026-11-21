// pages/Suppliers.jsx — Supplier Management
import { useState, useEffect } from 'react';
import { supplierService } from '../services/suppliers';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

const emptySupplierForm = {
  business_name: '',
  contact_person: '',
  phone: '',
  province: 'Free State',
  address: '',
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptySupplierForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  async function loadSuppliers() {
    setLoading(true);
    try {
      const response = await supplierService.getAll();
      setSuppliers(response.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Could not load suppliers.' });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData(emptySupplierForm);
    setIsModalOpen(true);
  }

  function handleOpenEdit(supplier) {
    setEditingId(supplier.supplier_id);
    setFormData({
      business_name: supplier.business_name,
      contact_person: supplier.contact_person,
      phone: supplier.phone,
      province: supplier.province,
      address: supplier.address,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      if (editingId) {
        await supplierService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Supplier updated successfully.' });
      } else {
        await supplierService.create(formData);
        setAlert({ type: 'success', message: 'New supplier registered successfully.' });
      }
      setIsModalOpen(false);
      loadSuppliers();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save supplier.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(supplier) {
    const confirmed = window.confirm(
      `Are you sure you want to delete supplier "${supplier.business_name}"?`
    );
    if (!confirmed) return;

    try {
      await supplierService.remove(supplier.supplier_id);
      setAlert({ type: 'success', message: 'Supplier deleted successfully.' });
      loadSuppliers();
    } catch (err) {
      setAlert({
        type: 'error',
        message: err.message || 'Cannot delete supplier because related purchase records exist.',
      });
    }
  }

  const columns = [
    { key: 'business_name', label: 'Business Name' },
    { key: 'contact_person', label: 'Contact Person' },
    { key: 'phone', label: 'Phone' },
    { key: 'province', label: 'South African Province' },
    { key: 'address', label: 'Address' },
    {
      key: 'actions',
      label: 'Actions',
      render: (supplier) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-ghost btn-small"
            onClick={() => handleOpenEdit(supplier)}
          >
            Edit
          </button>
          <button
            className="btn btn-danger btn-small"
            onClick={() => handleDelete(supplier)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Supplier Management</h2>
          <p className="muted">Manage fruit suppliers across South African provinces</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register New Supplier
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
          rows={suppliers}
          loading={loading}
          emptyText="No suppliers registered yet. Click 'Register New Supplier' above."
        />
      </div>

      {isModalOpen && (
        <Modal
          title={editingId ? 'Edit Supplier' : 'Register New Supplier'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="full">
              Business Name
              <input
                type="text"
                required
                placeholder="e.g. Maluti Fresh Orchards"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              />
            </label>

            <label>
              Contact Person
              <input
                type="text"
                required
                placeholder="e.g. Johan van der Merwe"
                value={formData.contact_person}
                onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              />
            </label>

            <label>
              Phone Number
              <input
                type="text"
                required
                placeholder="e.g. +27 51 405 8000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </label>

            <label className="full">
              South African Province
              <select
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              >
                {PROVINCES.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </label>

            <label className="full">
              Address
              <textarea
                rows={2}
                required
                placeholder="Farm/street address, town"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
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
                {saving ? 'Saving...' : editingId ? 'Update Supplier' : 'Save Supplier'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
