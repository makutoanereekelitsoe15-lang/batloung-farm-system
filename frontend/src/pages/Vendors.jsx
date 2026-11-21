// pages/Vendors.jsx — Street Vendor & Retailer Management
import { useState, useEffect } from 'react';
import { vendorService } from '../services/vendors';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

const emptyVendorForm = {
  vendor_name: '',
  phone_number: '',
  location: '',
  registration_date: new Date().toISOString().slice(0, 10),
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyVendorForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  async function loadVendors(searchTerm = search) {
    setLoading(true);
    try {
      const response = await vendorService.getAll(searchTerm);
      setVendors(response.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Could not load vendors.' });
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadVendors(search);
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData({
      ...emptyVendorForm,
      registration_date: new Date().toISOString().slice(0, 10),
    });
    setIsModalOpen(true);
  }

  function handleOpenEdit(vendor) {
    setEditingId(vendor.vendor_id);
    setFormData({
      vendor_name: vendor.vendor_name,
      phone_number: vendor.phone_number,
      location: vendor.location,
      registration_date: vendor.registration_date ? vendor.registration_date.slice(0, 10) : '',
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setAlert({ type: '', message: '' });

    try {
      if (editingId) {
        await vendorService.update(editingId, formData);
        setAlert({ type: 'success', message: 'Vendor details updated successfully.' });
      } else {
        await vendorService.create(formData);
        setAlert({ type: 'success', message: 'New vendor registered successfully.' });
      }
      setIsModalOpen(false);
      loadVendors();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to save vendor.' });
    } finally {
      setSaving(false);
    }
  }

  const columns = [
    { key: 'vendor_name', label: 'Vendor / Retailer Name' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'location', label: 'Location (Lesotho)' },
    {
      key: 'registration_date',
      label: 'Registration Date',
      render: (v) => (v.registration_date ? v.registration_date.slice(0, 10) : '-'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (vendor) => (
        <button
          className="btn btn-ghost btn-small"
          onClick={() => handleOpenEdit(vendor)}
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
          <h2>Street Vendor & Retailer Management</h2>
          <p className="muted">Manage local street vendors and fruit retailers operating in Maseru and Lesotho</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          + Register New Vendor
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
        <form onSubmit={handleSearchSubmit} className="toolbar" style={{ marginBottom: '16px' }}>
          <input
            type="text"
            placeholder="Search by vendor name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
          {search && (
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setSearch('');
                loadVendors('');
              }}
            >
              Clear
            </button>
          )}
        </form>

        <DataTable
          columns={columns}
          rows={vendors}
          loading={loading}
          emptyText="No vendors found matching your criteria."
        />
      </div>

      {isModalOpen && (
        <Modal
          title={editingId ? 'Edit Vendor Details' : 'Register New Vendor'}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSubmit} className="form-grid">
            <label className="full">
              Vendor Name
              <input
                type="text"
                required
                placeholder="e.g. 'Masechaba Fruit Stall or Thabo Lerotholi"
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
              />
            </label>

            <label>
              Phone Number
              <input
                type="text"
                required
                placeholder="e.g. +266 5800 1234"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              />
            </label>

            <label>
              Location / Market Area
              <input
                type="text"
                required
                placeholder="e.g. Maseru Market, Pitso Ground"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </label>

            {!editingId && (
              <label className="full">
                Registration Date
                <input
                  type="date"
                  value={formData.registration_date}
                  onChange={(e) =>
                    setFormData({ ...formData, registration_date: e.target.value })
                  }
                />
              </label>
            )}

            <div className="full form-actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Vendor' : 'Register Vendor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
