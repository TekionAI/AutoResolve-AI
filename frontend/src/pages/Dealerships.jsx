
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import {
  Building2,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'react-toastify';

const extractArray = (response) => {
  const result = response?.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;

  return [];
};

const getDealershipLocation = (dealership) => {
  const location = dealership.location;

  if (!location) return '-';

  if (typeof location === 'string') return location;

  return [
    location.city,
    location.state
  ].filter(Boolean).join(', ') || location.address || '-';
};

const getDealershipStock = (dealership, inventory) => {
  return inventory
    .filter(item => {
      const dealershipId =
        typeof item.dealership === 'object'
          ? item.dealership?._id
          : item.dealership;

      return String(dealershipId) === String(dealership._id);
    })
    .reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
};

export default function Dealerships() {
  const [dealerships, setDealerships] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [dealershipRes, inventoryRes] = await Promise.all([
        api.get('/dealerships'),
        api.get('/inventory')
      ]);

      setDealerships(extractArray(dealershipRes));
      setInventory(extractArray(inventoryRes));
    } catch (error) {
      console.error('Dealership loading error:', error);

      toast.error(
        error.response?.data?.message ||
        'Unable to load dealership information'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDealerships = useMemo(() => {
    const term = search.toLowerCase();

    return dealerships.filter(dealership => {
      const location = getDealershipLocation(dealership);

      return [
        dealership.name,
        dealership.dealershipCode,
        location,
        dealership.email,
        dealership.contactNumber
      ].some(value =>
        String(value || '').toLowerCase().includes(term)
      );
    });
  }, [dealerships, search]);

  const totalStock = inventory.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const columns = [
    {
      header: 'Dealership',
      accessor: 'name',
      render: dealership => (
        <div className="min-w-[190px]">
          <p className="font-semibold text-white">
            {dealership.name || 'Unnamed Dealership'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Code: {dealership.dealershipCode || '-'}
          </p>
        </div>
      )
    },
    {
      header: 'Location',
      accessor: 'location',
      render: dealership => (
        <div className="min-w-[160px]">
          <div className="flex items-center gap-2 text-slate-200">
            <MapPin size={15} className="text-blue-400" />
            {getDealershipLocation(dealership)}
          </div>
          {dealership.location?.address && (
            <p className="mt-1 text-xs text-slate-400">
              {dealership.location.address}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Contact',
      accessor: 'contactNumber',
      render: dealership => (
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2 text-slate-300">
            <Phone size={14} className="text-slate-400" />
            {dealership.contactNumber || '-'}
          </p>
          <p className="flex items-center gap-2 text-slate-400">
            <Mail size={14} />
            {dealership.email || '-'}
          </p>
        </div>
      )
    },
    {
      header: 'Inventory Records',
      accessor: 'inventoryRecords',
      render: dealership => {
        const count = inventory.filter(item => {
          const id =
            typeof item.dealership === 'object'
              ? item.dealership?._id
              : item.dealership;

          return String(id) === String(dealership._id);
        }).length;

        return (
          <span className="font-semibold text-white">
            {count}
          </span>
        );
      }
    },
    {
      header: 'Total Stock',
      accessor: 'totalStock',
      render: dealership => (
        <span className="font-bold text-emerald-400">
          {getDealershipStock(dealership, inventory)} units
        </span>
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Sister Dealerships
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Dealership network, locations and parts availability
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

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Total Dealerships
            </p>
            <Building2 size={22} className="text-blue-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {dealerships.length}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Inventory Records
            </p>
            <Package size={22} className="text-purple-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {inventory.length}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Network Stock
            </p>
            <Package size={22} className="text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {totalStock}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Total available inventory units
          </p>
        </div>

      </div>

      {/* SEARCH */}
      <div className="relative">
        <Search
          size={17}
          className="absolute left-3 top-3 text-slate-400"
        />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search dealership, code, location or contact..."
          className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>

      {/* DEALERSHIP TABLE */}
      <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">
            Dealership Network
          </h2>
          <span className="text-xs text-slate-400">
            {filteredDealerships.length} dealerships
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredDealerships}
          loading={loading}
          emptyMessage="No dealerships found. Check the dealership API or add dealership records."
        />
      </div>

    </div>
  );
}
