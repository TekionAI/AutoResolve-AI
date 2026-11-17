
import React, { useEffect, useState } from 'react';
import { repairOrderService } from '../services/repairOrderService';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Loading from '../components/common/Loading';
import api from '../services/api';
import { toast } from 'react-toastify';
import { Plus, X, RefreshCw, Search, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useAutoRefresh, { notifyDataChanged } from '../hooks/useAutoRefresh';

const initialForm = {
  roNumber: `RO-${Date.now().toString().slice(-6)}`,
  dealership: '',
  customerName: '',
  phone: '',
  make: 'Maruti Suzuki',
  model: '',
  registrationNumber: '',
  mileage: '',
  operation: '',
  duration: '60',
  part: '',
  quantity: '1',
  priority: 'Medium',
  status: 'Ready for Service',
  blockedReason: ''
};

const getArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

export default function RepairOrders() {
  const { user } = useAuth();
  const isTechnician = user?.role === 'Technician';

  const [data, setData] = useState([]);
  const [dealerships, setDealerships] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRO, setSelectedRO] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(initialForm);

  const loadData = async (showLoading = false) => {
  try {
    if (showLoading) {
      setLoading(true);
    }

      if (isTechnician) {
        const roRes = await repairOrderService.getAll();
        setData(getArray(roRes));
        setDealerships([]);
        setParts([]);
        return;
      }

      const [roRes, dealershipRes, partRes] = await Promise.all([
        repairOrderService.getAll(),
        api.get('/dealerships'),
        api.get('/parts')
      ]);

      setData(getArray(roRes));
      setDealerships(getArray(dealershipRes));
      setParts(getArray(partRes));
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
        'Failed to load repair order information'
      );
    }finally {
  if (showLoading) {
    setLoading(false);
  }
}
  };

  useEffect(() => {
  loadData(true);
}, [isTechnician]);

useAutoRefresh(loadData);

  const updateField = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const closeForm = () => {
    setShowForm(false);
    setForm({
      ...initialForm,
      roNumber: `RO-${Date.now().toString().slice(-6)}`
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (isTechnician) {
      toast.error('Technicians cannot create repair orders');
      return;
    }

    if (!form.dealership || !form.part) {
      toast.error('Please select a dealership and required part');
      return;
    }

    const isBlocked = form.status === 'Waiting for Parts';

    const payload = {
      roNumber: form.roNumber.trim(),
      dealership: form.dealership,
      customer: {
        name: form.customerName.trim(),
        phone: form.phone.trim()
      },
      vehicle: {
        make: form.make.trim(),
        model: form.model.trim(),
        registrationNumber: form.registrationNumber.trim(),
        mileage: Number(form.mileage)
      },
      operations: [
        {
          name: form.operation.trim(),
          estimatedDuration: Number(form.duration)
        }
      ],
      requiredParts: [
        {
          part: form.part,
          requiredQuantity: Number(form.quantity)
        }
      ],
      priority: form.priority,
      status: form.status,
      isBlocked,
      blockedReason: isBlocked ? form.blockedReason.trim() : null
    };

    try {
      setSaving(true);
      await repairOrderService.create(payload);

      toast.success('Repair order created successfully!');
closeForm();
await loadData();
notifyDataChanged();
    } catch (error) {
      console.error('Create RO error:', error);
      toast.error(
        error.response?.data?.message ||
        'Failed to create repair order'
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredData = data.filter(ro => {
    const term = search.toLowerCase();

    return (
      (ro.roNumber || '').toLowerCase().includes(term) ||
      (ro.customer?.name || '').toLowerCase().includes(term) ||
      (ro.vehicle?.model || '').toLowerCase().includes(term) ||
      (ro.vehicle?.registrationNumber || '').toLowerCase().includes(term)
    );
  });

  const cols = [
    {
      header: 'RO Number',
      accessor: 'roNumber',
      render: (r) => (
        <span className="font-bold text-white">
          {r.roNumber || r._id?.substring(0, 8)}
        </span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customer',
      render: (r) => (
        <div>
          <p className="font-medium text-white">
            {r.customer?.name || 'N/A'}
          </p>
          <p className="text-xs text-slate-400">
            {r.customer?.phone || '-'}
          </p>
        </div>
      )
    },
    {
      header: 'Vehicle',
      accessor: 'vehicle',
      render: (r) => (
        <div>
          <p className="text-white">
            {r.vehicle?.make} {r.vehicle?.model}
          </p>
          <p className="text-xs text-slate-400">
            {r.vehicle?.registrationNumber || '-'}
          </p>
        </div>
      )
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (r) => (
        <span className="text-sm text-slate-300">
          {r.priority || '-'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => <StatusBadge status={r.status} />
    },
    {
      header: 'Assigned Technician',
      accessor: 'assignedTechnician',
      render: (r) => r.assignedTechnician?.name || '-'
    },
    {
      header: 'Assigned Bay',
      accessor: 'assignedBay',
      render: (r) => r.assignedBay?.bayNumber || '-'
    },
    {
      header: 'Action',
      accessor: '_id',
      render: (r) => (
        <button
          onClick={() => setSelectedRO(r)}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20"
        >
          <Eye size={15} />
          View Details
        </button>
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isTechnician ? 'My Assigned Repair Orders' : 'Repair Orders'}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {isTechnician
              ? 'View your assigned repair jobs and their current status'
              : 'Manage customer repair orders and service operations'}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-3 py-2 text-sm text-white hover:bg-dark-700"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          {!isTechnician && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              <Plus size={18} />
              Create RO
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
          <p className="text-sm text-slate-400">
            {isTechnician ? 'My Total Jobs' : 'Total Repair Orders'}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{data.length}</p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
          <p className="text-sm text-slate-400">Blocked Orders</p>
          <p className="mt-2 text-2xl font-bold text-red-400">
            {data.filter(r => r.isBlocked).length}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
          <p className="text-sm text-slate-400">Ready for Service</p>
          <p className="mt-2 text-2xl font-bold text-green-400">
            {data.filter(r => r.status === 'Ready for Service').length}
          </p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-3 text-slate-400"
          size={17}
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search RO, customer, vehicle or registration..."
          className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>

      <DataTable columns={cols} data={filteredData} loading={loading} />

      {filteredData.length === 0 && (
        <p className="text-center text-sm text-slate-400">
          {isTechnician
            ? 'No repair orders are currently assigned to you.'
            : 'No repair orders found.'}
        </p>
      )}

      {selectedRO && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 p-4">
          <div className="my-6 w-full max-w-3xl rounded-xl border border-dark-700 bg-dark-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-700 p-5">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Repair Order Details
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedRO.roNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedRO(null)}
                className="text-slate-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            <div className="space-y-6 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={selectedRO.status} />
                <span className="rounded-full bg-dark-700 px-3 py-1 text-xs text-slate-300">
                  Priority: {selectedRO.priority || '-'}
                </span>
                {selectedRO.isBlocked && (
                  <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400">
                    Parts Blocked
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DetailSection title="Customer Information">
                  <Detail label="Name" value={selectedRO.customer?.name} />
                  <Detail label="Phone" value={selectedRO.customer?.phone} />
                </DetailSection>

                <DetailSection title="Vehicle Information">
                  <Detail label="Make" value={selectedRO.vehicle?.make} />
                  <Detail label="Model" value={selectedRO.vehicle?.model} />
                  <Detail label="Registration" value={selectedRO.vehicle?.registrationNumber} />
                  <Detail label="Mileage" value={`${selectedRO.vehicle?.mileage ?? 0} km`} />
                </DetailSection>
              </div>

              <DetailSection title="Service Operations">
                {selectedRO.operations?.length ? (
                  selectedRO.operations.map((operation, index) => (
                    <div key={index} className="flex justify-between gap-3 border-b border-dark-700 py-2 last:border-0">
                      <span className="text-slate-200">{operation.name}</span>
                      <span className="text-slate-400">
                        {operation.estimatedDuration} min
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No operations listed.</p>
                )}
              </DetailSection>

              <DetailSection title="Required Parts">
                {selectedRO.requiredParts?.length ? (
                  selectedRO.requiredParts.map((item, index) => (
                    <div key={index} className="flex flex-wrap justify-between gap-3 border-b border-dark-700 py-2 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {item.part?.name || item.part?.partNumber || 'Part'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {item.part?.partNumber || 'Part number unavailable'}
                        </p>
                      </div>
                      <span className="text-sm text-slate-300">
                        Required: {item.requiredQuantity}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No parts listed.</p>
                )}
              </DetailSection>

              {selectedRO.isBlocked && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
                  <h3 className="font-semibold text-red-400">
                    Parts Shortage / Blocking Reason
                  </h3>
                  <p className="mt-2 text-sm text-slate-200">
                    {selectedRO.blockedReason || 'This repair order is blocked due to a parts shortage.'}
                  </p>
                </div>
              )}

              <DetailSection title="Assignment Information">
                <Detail
                  label="Technician"
                  value={selectedRO.assignedTechnician?.name}
                />
                <Detail
                  label="Employee ID"
                  value={selectedRO.assignedTechnician?.employeeId}
                />
                <Detail
                  label="Service Bay"
                  value={selectedRO.assignedBay?.bayNumber}
                />
                <Detail
                  label="Scheduled Start"
                  value={
                    selectedRO.scheduledStart
                      ? new Date(selectedRO.scheduledStart).toLocaleString()
                      : 'Not scheduled'
                  }
                />
              </DetailSection>
            </div>

            <div className="flex justify-end border-t border-dark-700 p-5">
              <button
                onClick={() => setSelectedRO(null)}
                className="rounded-lg bg-dark-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-dark-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && !isTechnician && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-6 w-full max-w-3xl rounded-xl border border-dark-700 bg-dark-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-dark-700 p-5">
              <div>
                <h2 className="text-xl font-bold text-white">Create Repair Order</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Enter customer, vehicle and service details
                </p>
              </div>
              <button onClick={closeForm} className="text-slate-400 hover:text-white">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-5 p-5">
              <div>
                <h3 className="mb-3 font-semibold text-blue-400">Repair Order Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="RO Number">
                    <input name="roNumber" value={form.roNumber} onChange={updateField} required className={inputClass} />
                  </Field>
                  <Field label="Dealership">
                    <select name="dealership" value={form.dealership} onChange={updateField} required className={inputClass}>
                      <option value="">Select Dealership</option>
                      {dealerships.map(d => (
                        <option key={d._id} value={d._id}>
                          {d.name || d.dealershipName || d._id}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-blue-400">Customer Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Customer Name">
                    <input name="customerName" value={form.customerName} onChange={updateField} required className={inputClass} placeholder="Enter customer name" />
                  </Field>
                  <Field label="Phone Number">
                    <input name="phone" value={form.phone} onChange={updateField} required className={inputClass} placeholder="Enter phone number" />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-blue-400">Vehicle Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Vehicle Make">
                    <input name="make" value={form.make} onChange={updateField} required className={inputClass} />
                  </Field>
                  <Field label="Vehicle Model">
                    <input name="model" value={form.model} onChange={updateField} required className={inputClass} placeholder="e.g. Brezza" />
                  </Field>
                  <Field label="Registration Number">
                    <input name="registrationNumber" value={form.registrationNumber} onChange={updateField} required className={inputClass} placeholder="e.g. MH12AB1234" />
                  </Field>
                  <Field label="Current Mileage (km)">
                    <input name="mileage" type="number" min="0" value={form.mileage} onChange={updateField} required className={inputClass} />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-blue-400">Service and Parts Information</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Service Operation">
                    <input name="operation" value={form.operation} onChange={updateField} required className={inputClass} placeholder="e.g. Front Brake Pad Replacement" />
                  </Field>
                  <Field label="Estimated Duration (minutes)">
                    <input name="duration" type="number" min="1" value={form.duration} onChange={updateField} required className={inputClass} />
                  </Field>
                  <Field label="Required Part">
                    <select name="part" value={form.part} onChange={updateField} required className={inputClass}>
                      <option value="">Select Part</option>
                      {parts.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.partNumber || p.partCode || ''} {p.name || p.partName || p.description || 'Part'}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Required Quantity">
                    <input name="quantity" type="number" min="1" value={form.quantity} onChange={updateField} required className={inputClass} />
                  </Field>
                </div>
              </div>

              <div>
                <h3 className="mb-3 font-semibold text-blue-400">Priority and Status</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Priority">
                    <select name="priority" value={form.priority} onChange={updateField} className={inputClass}>
                      {['Low', 'Medium', 'High', 'Urgent'].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Status">
                    <select name="status" value={form.status} onChange={updateField} className={inputClass}>
                      <option value="Ready for Service">Ready for Service</option>
                      <option value="Waiting for Parts">Waiting for Parts</option>
                    </select>
                  </Field>
                </div>

                {form.status === 'Waiting for Parts' && (
                  <Field label="Reason for Waiting for Parts">
                    <input name="blockedReason" value={form.blockedReason} onChange={updateField} required className={inputClass} placeholder="e.g. Required part unavailable" />
                  </Field>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-dark-700 pt-5">
                <button type="button" onClick={closeForm} className="rounded-lg border border-dark-600 px-5 py-2.5 text-sm text-slate-300 hover:bg-dark-700">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Repair Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-lg border border-dark-600 bg-dark-900 px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500';

function Field({ label, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function DetailSection({ title, children }) {
  return (
    <section className="rounded-lg border border-dark-700 bg-dark-900/50 p-4">
      <h3 className="mb-3 font-semibold text-blue-400">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Detail({ label, value }) {
  return (
    <div className="flex justify-between gap-3 border-b border-dark-700 py-1.5 last:border-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-right text-sm text-slate-200">
        {value || '-'}
      </span>
    </div>
  );
}
