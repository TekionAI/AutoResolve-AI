
import React, { useEffect, useState } from 'react';
import { inventoryService } from '../services/inventoryService';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Loading from '../components/common/Loading';
import { Package, AlertTriangle, Boxes, RefreshCw, Search } from 'lucide-react';
import { toast } from 'react-toastify';

const getArray = (response) => {
  const value = response?.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const getPart = (row) =>
  typeof row.part === 'object' && row.part !== null ? row.part : {};

const getDealership = (row) =>
  typeof row.dealership === 'object' && row.dealership !== null
    ? row.dealership
    : {};

const getPartName = (row) => {
  const part = getPart(row);
  return part.name || part.partName || part.description || 'Unknown Part';
};

const getPartNumber = (row) => {
  const part = getPart(row);
  return part.partNumber || part.partCode || part.code || '-';
};

const getAvailable = (row) =>
  Math.max(0, Number(row.quantity || 0) - Number(row.reserved || 0));

const getStockStatus = (row) => {
  const available = getAvailable(row);

  if (available === 0) return 'Out of Stock';
  if (available <= 5) return 'Low Stock';
  return 'In Stock';
};

export default function Inventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  
  const loadInventory = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const res = await inventoryService.getInventory();
      setData(getArray(res));
    } catch (error) {
      console.error('Inventory loading error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to load inventory'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const totalStock = data.reduce(
    (sum, row) => sum + Number(row.quantity || 0), 0
  );

  const totalReserved = data.reduce(
    (sum, row) => sum + Number(row.reserved || 0), 0
  );

  const totalAvailable = data.reduce(
    (sum, row) => sum + getAvailable(row), 0
  );

  const lowStockCount = data.filter(
    row => getAvailable(row) > 0 && getAvailable(row) <= 5
  ).length;

  const outOfStockCount = data.filter(
    row => getAvailable(row) === 0
  ).length;

  const filteredData = data.filter(row => {
    const part = getPart(row);
    const dealership = getDealership(row);

    const text = [
      getPartName(row),
      getPartNumber(row),
      dealership.name,
      dealership.dealershipName,
      row.dealership
    ].join(' ').toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const status = getStockStatus(row);
    const matchesFilter = filter === 'All' || status === filter;

    return matchesSearch && matchesFilter;
  });

  const columns = [
    {
      header: 'Part Details',
      accessor: 'part',
      render: row => (
        <div>
          <p className="font-semibold text-white">{getPartName(row)}</p>
          <p className="mt-1 text-xs text-slate-400">
            Part No: {getPartNumber(row)}
          </p>
          {getPart(row).category && (
            <p className="mt-1 text-xs text-slate-500">
              {getPart(row).category}
            </p>
          )}
        </div>
      )
    },
    {
      header: 'Dealership',
      accessor: 'dealership',
      render: row => {
        const dealership = getDealership(row);
        return (
          <div>
            <p className="text-slate-200">
              {dealership.name ||
                dealership.dealershipName ||
                (typeof row.dealership === 'string' ? row.dealership : 'N/A')}
            </p>
            {dealership.location && (
              <p className="mt-1 text-xs text-slate-400">
                {dealership.location}
              </p>
            )}
          </div>
        );
      }
    },
    {
      header: 'Total Stock',
      accessor: 'quantity',
      render: row => (
        <span className="font-semibold text-white">
          {Number(row.quantity || 0)}
        </span>
      )
    },
    {
      header: 'Reserved',
      accessor: 'reserved',
      render: row => (
        <span className="text-yellow-400">
          {Number(row.reserved || 0)}
        </span>
      )
    },
    {
      header: 'Available',
      accessor: 'available',
      render: row => {
        const available = getAvailable(row);
        return (
          <span className={`font-bold ${
            available === 0
              ? 'text-red-400'
              : available <= 5
              ? 'text-yellow-400'
              : 'text-emerald-400'
          }`}>
            {available}
          </span>
        );
      }
    },
    {
      header: 'Stock Status',
      accessor: 'status',
      render: row => <StatusBadge status={getStockStatus(row)} />
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Local & Network Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor spare parts, dealership stock and availability
          </p>
        </div>

        <button
          onClick={() => loadInventory(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-white hover:bg-dark-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Inventory Records</p>
            <Package className="text-blue-400" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{data.length}</p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Stock Units</p>
            <Boxes className="text-cyan-400" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">{totalStock}</p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Available Units</p>
            <Package className="text-green-400" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-green-400">
            {totalAvailable}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {totalReserved} units reserved
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Stock Alerts</p>
            <AlertTriangle className="text-yellow-400" size={21} />
          </div>
          <p className="mt-3 text-3xl font-bold text-yellow-400">
            {lowStockCount + outOfStockCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {lowStockCount} low stock · {outOfStockCount} out of stock
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
            placeholder="Search part or dealership..."
            className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-white outline-none"
        >
          <option value="All">All Stock</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* INVENTORY TABLE */}
      <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Inventory Details</h2>
          <span className="text-xs text-slate-400">
            {filteredData.length} records
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredData}
          loading={loading}
          emptyMessage="No inventory records match your search."
        />
      </div>

      <p className="text-xs text-slate-500">
        Available stock = Total stock − Reserved stock. Low stock is defined
        as 5 or fewer available units.
      </p>

    </div>
  );
}
