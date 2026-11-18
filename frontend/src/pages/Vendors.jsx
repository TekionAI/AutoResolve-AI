
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import StatusBadge from '../components/common/StatusBadge';
import useAutoRefresh from '../hooks/useAutoRefresh';

import {
  Truck,
  Package,
  Search,
  RefreshCw,
  Clock,
  Star,
  IndianRupee,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { toast } from 'react-toastify';

const extractArray = (response) => {
  const result = response?.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;

  return [];
};

const formatPrice = (value) => {
  if (value === undefined || value === null) return '-';
  return `₹${Number(value).toLocaleString('en-IN')}`;
};

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [vendorInventory, setVendorInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const loadData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [vendorRes, inventoryRes] = await Promise.all([
        api.get('/vendors'),
        api.get('/vendor-inventory')
      ]);

      setVendors(extractArray(vendorRes));
      setVendorInventory(extractArray(inventoryRes));
    } catch (error) {
      console.error('Vendor loading error:', error);

      toast.error(
        error.response?.data?.message ||
        'Unable to load vendor information'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);
  useAutoRefresh(loadData);

  const getVendorId = (item) => {
    return typeof item.vendor === 'object'
      ? item.vendor?._id
      : item.vendor;
  };

  const getPartName = (item) => {
    if (typeof item.part === 'object') {
      return item.part?.name ||
        item.part?.partName ||
        item.part?.partNumber ||
        'Unnamed Part';
    }

    return 'Part details unavailable';
  };

  const getVendorItems = (vendorId) => {
    return vendorInventory.filter(
      item => String(getVendorId(item)) === String(vendorId)
    );
  };

  const filteredVendors = useMemo(() => {
    const term = search.toLowerCase();

    return vendors.filter(vendor => {
      const matchesSearch = [
        vendor.name,
        vendor.vendorCode,
        vendor.contactPerson,
        vendor.contactNumber,
        vendor.email,
        vendor.address?.city,
        vendor.address?.state
      ].some(value =>
        String(value || '').toLowerCase().includes(term)
      );

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Active' && vendor.isActive) ||
        (statusFilter === 'Inactive' && !vendor.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [vendors, search, statusFilter]);

  const activeVendors = vendors.filter(vendor => vendor.isActive).length;

  const totalVendorStock = vendorInventory.reduce(
    (sum, item) => sum + Number(item.availableQuantity || 0),
    0
  );

  const availableItems = vendorInventory.filter(
    item => item.isAvailable
  ).length;

  const columns = [
    {
      header: 'Vendor Details',
      accessor: 'name',
      render: vendor => (
        <div className="min-w-[190px]">
          <p className="font-semibold text-white">
            {vendor.name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Code: {vendor.vendorCode || '-'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Contact: {vendor.contactPerson || '-'}
          </p>
        </div>
      )
    },
    {
      header: 'Contact Information',
      accessor: 'contactNumber',
      render: vendor => (
        <div className="min-w-[170px] space-y-1 text-sm">
          <p className="flex items-center gap-2 text-slate-300">
            <Phone size={14} className="text-slate-400" />
            {vendor.contactNumber || '-'}
          </p>
          <p className="flex items-center gap-2 text-slate-400">
            <Mail size={14} />
            {vendor.email || '-'}
          </p>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'address',
      render: vendor => (
        <div className="min-w-[130px]">
          <p className="flex items-center gap-2 text-slate-300">
            <MapPin size={14} className="text-blue-400" />
            {vendor.address?.city || '-'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {vendor.address?.state || ''}
          </p>
          {vendor.address?.fullAddress && (
            <p className="mt-1 text-xs text-slate-500">
              {vendor.address.fullAddress}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Parts Supplied',
      accessor: 'partsSupplied',
      render: vendor => {
        const items = getVendorItems(vendor._id);

        return (
          <div>
            <p className="font-semibold text-white">
              {items.length} parts
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {items.filter(item => item.isAvailable).length} available
            </p>
          </div>
        );
      }
    },
    {
      header: 'Available Stock',
      accessor: 'availableQuantity',
      render: vendor => {
        const items = getVendorItems(vendor._id);

        const quantity = items.reduce(
          (sum, item) => sum + Number(item.availableQuantity || 0),
          0
        );

        return (
          <span className="font-bold text-emerald-400">
            {quantity} units
          </span>
        );
      }
    },
    {
      header: 'Delivery',
      accessor: 'averageDeliveryTime',
      render: vendor => (
        <span className="flex items-center gap-2 text-slate-300">
          <Clock size={15} className="text-blue-400" />
          {vendor.averageDeliveryTime ?? '-'} hrs
        </span>
      )
    },
    {
      header: 'Reliability',
      accessor: 'reliabilityScore',
      render: vendor => (
        <span className="flex items-center gap-2 text-amber-400">
          <Star size={15} />
          {vendor.reliabilityScore ?? '-'}%
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: vendor => (
        <StatusBadge
          status={vendor.isActive ? 'Active' : 'Inactive'}
        />
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            External Vendors
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Supplier network, part availability and sourcing information
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-white hover:bg-dark-700 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Vendors</p>
            <Truck size={22} className="text-blue-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {vendors.length}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Active Vendors</p>
            <Truck size={22} className="text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {activeVendors}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Vendor Stock</p>
            <Package size={22} className="text-purple-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {totalVendorStock}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Available quantity across vendor records
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Available Part Listings</p>
            <IndianRupee size={22} className="text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {availableItems}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Vendor inventory entries marked available
          </p>
        </div>

      </div>

      {/* SEARCH AND FILTER */}
      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={17}
            className="absolute left-3 top-3 text-slate-400"
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendor, code, contact or location..."
            className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-white outline-none"
        >
          <option value="All">All Vendors</option>
          <option value="Active">Active Vendors</option>
          <option value="Inactive">Inactive Vendors</option>
        </select>
      </div>

      {/* VENDOR TABLE */}
      <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-white">
            Vendor Network
          </h2>
          <span className="text-xs text-slate-400">
            Showing {filteredVendors.length} of {vendors.length} vendors
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredVendors}
          loading={loading}
          emptyMessage="No vendors registered. Check the vendor API or add vendor records."
        />
      </div>

      {/* VENDOR PART CATALOGUE */}
      <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
        <div className="mb-4">
          <h2 className="font-semibold text-white">
            Vendor Parts Catalogue
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Part-wise pricing, availability and delivery estimates
          </p>
        </div>

        <DataTable
          columns={[
            {
              header: 'Vendor',
              accessor: 'vendor',
              render: item => (
                <span className="font-medium text-white">
                  {typeof item.vendor === 'object'
                    ? item.vendor?.name || '-'
                    : vendors.find(v => String(v._id) === String(item.vendor))?.name || '-'}
                </span>
              )
            },
            {
              header: 'Part',
              accessor: 'part',
              render: item => (
                <div>
                  <p className="font-medium text-slate-200">
                    {getPartName(item)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {typeof item.part === 'object'
                      ? item.part?.partNumber || ''
                      : ''}
                  </p>
                </div>
              )
            },
            {
              header: 'Available Quantity',
              accessor: 'availableQuantity',
              render: item => (
                <span className="font-semibold text-emerald-400">
                  {item.availableQuantity} units
                </span>
              )
            },
            {
              header: 'Unit Price',
              accessor: 'unitPrice',
              render: item => (
                <span className="text-slate-200">
                  {formatPrice(item.unitPrice)}
                </span>
              )
            },
            {
              header: 'Delivery',
              accessor: 'estimatedDeliveryHours',
              render: item => (
                <span className="text-slate-300">
                  {item.estimatedDeliveryHours} hrs
                </span>
              )
            },
            {
              header: 'Availability',
              accessor: 'isAvailable',
              render: item => (
                <StatusBadge
                  status={item.isAvailable ? 'Available' : 'Unavailable'}
                />
              )
            }
          ]}
          data={vendorInventory}
          loading={loading}
          emptyMessage="No vendor inventory records found."
        />
      </div>

    </div>
  );
}
