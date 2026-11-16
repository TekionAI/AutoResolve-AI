
import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import {
  RefreshCw,
  ClipboardList,
  AlertTriangle,
  Package,
  BrainCircuit,
  CalendarClock
} from 'lucide-react';

import api from '../services/api';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';

const COLORS = ['#38bdf8', '#a78bfa', '#f59e0b', '#34d399', '#f87171'];

const extractArray = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.recommendations)) return data.recommendations;
  if (Array.isArray(data?.schedules)) return data.schedules;

  return [];
};

const Analytics = () => {
  const [repairOrders, setRepairOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setError('');

      const [roRes, inventoryRes, recommendationRes, scheduleRes] =
        await Promise.all([
          api.get('/repair-orders'),
          api.get('/inventory'),
          api.get('/recommendations'),
          api.get('/schedules')
        ]);

      setRepairOrders(extractArray(roRes));
      setInventory(extractArray(inventoryRes));
      setRecommendations(extractArray(recommendationRes));
      setSchedules(extractArray(scheduleRes));
    } catch (err) {
      console.error('Analytics loading error:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load analytics. Please check the backend connection.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const activeOrders = repairOrders.filter(
    ro => !['Completed', 'Cancelled'].includes(ro.status)
  );

  const blockedOrders = repairOrders.filter(
    ro => ro.isBlocked || ro.status === 'Waiting for Parts'
  );

  const readyOrders = repairOrders.filter(
    ro => ro.status === 'Ready for Service' && !ro.isBlocked
  );

  const statusCounts = repairOrders.reduce((acc, ro) => {
    const status = ro.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusData = Object.entries(statusCounts).map(([name, value]) => ({
    name,
    value
  }));

  const priorityCounts = activeOrders.reduce((acc, ro) => {
    const priority = ro.priority || 'Unknown';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {});

  const priorityData = ['Urgent', 'High', 'Medium', 'Low'].map(name => ({
    name,
    value: priorityCounts[name] || 0
  }));

  const totalStock = inventory.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );

  const lowStockItems = inventory.filter(
    item => Number(item.quantity || 0) <= 5
  );

  const scheduleCount = schedules.filter(item =>
    ['Scheduled', 'In Progress', 'Delayed'].includes(item.status)
  ).length;

  const recommendationCounts = recommendations.reduce((acc, item) => {
    const status = item.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const recommendationData = Object.entries(recommendationCounts).map(
    ([name, value]) => ({ name, value })
  );

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 p-6 text-white">

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Live operational insights from AutoResolve AI
          </p>
        </div>

        <button
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm hover:bg-dark-700 disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Repair Orders"
          value={repairOrders.length}
          colorClass="border-blue-500/30"
        />
        <StatCard
          title="Active Repair Orders"
          value={activeOrders.length}
          colorClass="border-purple-500/30"
        />
        <StatCard
          title="Blocked Repair Orders"
          value={blockedOrders.length}
          colorClass="border-red-500/30"
        />
        <StatCard
          title="Ready for Service"
          value={readyOrders.length}
          colorClass="border-green-500/30"
        />
      </div>

      {/* REPAIR ORDER ANALYTICS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="mb-5 flex items-center gap-2">
            <ClipboardList className="text-blue-400" size={20} />
            <h2 className="font-semibold">Repair Order Status</h2>
          </div>

          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {statusData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-slate-400">
              No repair order data available
            </p>
          )}
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="mb-5 flex items-center gap-2">
            <AlertTriangle className="text-yellow-400" size={20} />
            <h2 className="font-semibold">Priority Distribution</h2>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={priorityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis allowDecimals={false} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}
              />
              <Bar
                dataKey="value"
                name="Repair Orders"
                fill="#38bdf8"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* INVENTORY AND RECOMMENDATIONS */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="mb-5 flex items-center gap-2">
            <Package className="text-green-400" size={20} />
            <h2 className="font-semibold">Inventory Overview</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-dark-900 p-4">
              <p className="text-sm text-slate-400">Inventory Records</p>
              <p className="mt-2 text-2xl font-bold">{inventory.length}</p>
            </div>

            <div className="rounded-lg bg-dark-900 p-4">
              <p className="text-sm text-slate-400">Total Stock Units</p>
              <p className="mt-2 text-2xl font-bold">{totalStock}</p>
            </div>

            <div className="col-span-2 rounded-lg bg-dark-900 p-4">
              <p className="text-sm text-slate-400">Low Stock Records (5 units or less)</p>
              <p className="mt-2 text-2xl font-bold text-yellow-400">
                {lowStockItems.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="mb-5 flex items-center gap-2">
            <BrainCircuit className="text-purple-400" size={20} />
            <h2 className="font-semibold">AI Recommendation Analysis</h2>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="rounded-lg bg-dark-900 p-4">
              <p className="text-sm text-slate-400">Total Recommendations</p>
              <p className="mt-2 text-2xl font-bold">
                {recommendations.length}
              </p>
            </div>

            <div className="rounded-lg bg-dark-900 p-4">
              <p className="text-sm text-slate-400">Applied Recommendations</p>
              <p className="mt-2 text-2xl font-bold text-green-400">
                {recommendationCounts.Applied || 0}
              </p>
            </div>
          </div>

          {recommendationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={recommendationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis allowDecimals={false} stroke="#94a3b8" />
                <Tooltip />
                <Bar
                  dataKey="value"
                  name="Recommendations"
                  fill="#a78bfa"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-slate-400">
              No recommendation data available
            </p>
          )}
        </div>
      </div>

      {/* SCHEDULING SUMMARY */}
      <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="text-cyan-400" size={20} />
          <h2 className="font-semibold">Workshop Scheduling Overview</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-dark-900 p-4">
            <p className="text-sm text-slate-400">Total Schedule Records</p>
            <p className="mt-2 text-2xl font-bold">{schedules.length}</p>
          </div>

          <div className="rounded-lg bg-dark-900 p-4">
            <p className="text-sm text-slate-400">Active Scheduled Jobs</p>
            <p className="mt-2 text-2xl font-bold text-cyan-400">
              {scheduleCount}
            </p>
          </div>

          <div className="rounded-lg bg-dark-900 p-4">
            <p className="text-sm text-slate-400">Blocked Repair Orders</p>
            <p className="mt-2 text-2xl font-bold text-red-400">
              {blockedOrders.length}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Analytics are calculated from currently available backend records.
        Low stock is defined here as 5 units or fewer.
      </p>

    </div>
  );
};

export default Analytics;
