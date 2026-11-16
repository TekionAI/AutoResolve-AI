
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import StatusBadge from '../components/common/StatusBadge';
import {
  Package,
  Search,
  RefreshCw,
  Boxes,
  AlertTriangle,
  IndianRupee
} from 'lucide-react';
import { toast } from 'react-toastify';

const getArray = (response) => {
  const value = response?.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const getStock = (part, inventory) => {
  return inventory
    .filter(item => {
      const partId =
        typeof item.part === 'object' ? item.part?._id : item.part;
      return String(partId) === String(part._id);
    })
    .reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);
};

const formatPrice = (value) => {
  if (value === undefined || value === null || value === '') return '-';

  return `₹${Number(value).toLocaleString('en-IN')}`;
};

export default function Parts() {
  const [parts, setParts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const loadParts = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [partsRes, inventoryRes] = await Promise.all([
        api.get('/parts'),
        api.get('/inventory')
      ]);

      setParts(getArray(partsRes));
      setInventory(getArray(inventoryRes));
    } catch (error) {
      console.error('Parts loading error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to load parts catalogue'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, []);

  const categories = useMemo(() => {
    return [
      ...new Set(parts.map(part => part.category).filter(Boolean))
    ];
  }, [parts]);

  const totalStock = inventory.reduce(
    (sum, item) => sum + Number(item.quantity || 0), 0
  );

  const filteredParts = parts.filter(part => {
    const term = search.toLowerCase();

    const matchesSearch = [
      part.name,
      part.partName,
      part.partNumber,
      part.partCode,
      part.category,
      part.description
    ].some(value => String(value || '').toLowerCase().includes(term));

    const matchesCategory =
      categoryFilter === 'All' || part.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      header: 'Part Information',
      accessor: 'name',
      render: part => (
        <div className="min-w-[180px]">
          <p className="font-semibold text-white">
            {part.name || part.partName || 'Unnamed Part'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {part.description || 'No description available'}
          </p>
        </div>
      )
    },
    {
      header: 'Part Number',
      accessor: 'partNumber',
      render: part => (
        <span className="font-mono text-sm text-blue-300">
          {part.partNumber || part.partCode || '-'}
        </span>
      )
    },
    {
      header: 'Category',
      accessor: 'category',
      render: part => (
        <span className="rounded-md bg-dark-700 px-2 py-1 text-xs text-slate-300">
          {part.category || 'Uncategorized'}
        </span>
      )
    },
    {
      header: 'Unit Price',
      accessor: 'unitPrice',
      render: part => (
        <span className="text-slate-200">
          {formatPrice(
            part.unitPrice ?? part.price ?? part.costPrice
          )}
        </span>
      )
    },
    {
      header: 'Network Stock',
      accessor: 'stock',
      render: part => {
        const stock = getStock(part, inventory);

        return (
          <span className={`font-bold ${
            stock === 0 ? 'text-red-400' : 'text-emerald-400'
          }`}>
            {stock}
          </span>
        );
      }
    },
    {
      header: 'Stock Status',
      accessor: 'stockStatus',
      render: part => {
        const stock = getStock(part, inventory);

        return (
          <StatusBadge
            status={
              stock === 0
                ? 'Out of Stock'
                : stock <= 5
                ? 'Low Stock'
                : 'In Stock'
            }
          />
        );
      }
    },
    {
      header: 'Compatibility',
      accessor: 'compatibility',
      render: part => {
        const models =
          part.compatibleModels ||
          part.compatibility ||
          part.vehicleModels;

        return (
          <span className="text-sm text-slate-300">
            {Array.isArray(models)
              ? models.join(', ')
              : models || '-'}
          </span>
        );
      }
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Parts Master</h1>
          <p className="mt-1 text-sm text-slate-400">
            Spare parts catalogue and dealership network availability
          </p>
        </div>

        <button
          onClick={() => loadParts(true)}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Parts</p>
            <Package className="text-blue-400" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {parts.length}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Categories</p>
            <Boxes className="text-purple-400" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {categories.length}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Network Stock Units</p>
            <IndianRupee className="text-green-400" size={22} />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {totalStock}
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
            placeholder="Search part name, number or category..."
            className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-white outline-none"
        >
          <option value="All">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* PARTS TABLE */}
      <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-white">
            Parts Catalogue
          </h2>
          <span className="text-xs text-slate-400">
            Showing {filteredParts.length} of {parts.length} parts
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredParts}
          loading={loading}
          emptyMessage="No parts match your search."
        />
      </div>

      <p className="text-xs text-slate-500">
        Network stock is calculated from dealership inventory records.
        Vendor inventory is displayed separately in the Vendors module.
      </p>

    </div>
  );
}
