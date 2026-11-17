
import React, { useEffect, useState, useCallback } from 'react';
import { repairOrderService } from '../services/repairOrderService';
import { scheduleService } from '../services/scheduleService';
import StatCard from '../components/common/StatCard';
import Loading from '../components/common/Loading';
import useAutoRefresh from '../hooks/useAutoRefresh';

import {
  RefreshCw,
  AlertTriangle,
  CalendarClock,
  Wrench,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Package
} from 'lucide-react';

const getData = (response) => {
  const result = response?.data?.data ?? response?.data;
  return Array.isArray(result) ? result : [];
};

const formatTime = (date) => {
  if (!date) return 'Not scheduled';

  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata'
  });
};

const statusStyles = {
  'Ready for Service': 'bg-emerald-500/10 text-emerald-400',
  'Waiting for Parts': 'bg-red-500/10 text-red-400',
  'In Progress': 'bg-blue-500/10 text-blue-400',
  'Completed': 'bg-slate-500/10 text-slate-400',
  'Created': 'bg-amber-500/10 text-amber-400',
  'Cancelled': 'bg-slate-500/10 text-slate-400'
};

const priorityStyles = {
  Urgent: 'text-red-400',
  High: 'text-orange-400',
  Medium: 'text-amber-400',
  Low: 'text-emerald-400'
};

const statusColors = {
  'Ready for Service': 'bg-emerald-500',
  'Waiting for Parts': 'bg-red-500',
  'In Progress': 'bg-blue-500',
  'Completed': 'bg-slate-500',
  'Created': 'bg-amber-500',
  'Cancelled': 'bg-slate-600'
};

export default function Dashboard() {
  const [repairOrders, setRepairOrders] = useState([]);
  const [bays, setBays] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async (showRefresh = false) => {
    try {
      setError('');

      if (showRefresh) {
        setRefreshing(true);
      }

      const [roRes, bayRes, scheduleRes] = await Promise.all([
        repairOrderService.getAll(),
        scheduleService.getServiceBays(),
        scheduleService.getSchedules()
      ]);

      setRepairOrders(getData(roRes));
      setBays(getData(bayRes));
      setSchedules(getData(scheduleRes));
    } catch (err) {
      console.error('Dashboard API error:', err);
      setError(
        err.response?.data?.message ||
        'Unable to load dashboard data.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useAutoRefresh(fetchDashboardData);

  if (loading) return <Loading />;

  const activeOrders = repairOrders.filter(
    ro => !['Completed', 'Cancelled'].includes(ro.status)
  );

  const blockedOrders = repairOrders.filter(
    ro =>
      ro.isBlocked === true &&
      !['Completed', 'Cancelled'].includes(ro.status)
  );

  const readyOrders = repairOrders.filter(
    ro => ro.status === 'Ready for Service'
  );

  const scheduledJobs = schedules.filter(
    s => ['Scheduled', 'In Progress', 'Delayed'].includes(s.status)
  );

  const sortedSchedules = [...scheduledJobs].sort(
    (a, b) =>
      new Date(a.scheduledStart) - new Date(b.scheduledStart)
  );

  const recentOrders = [...repairOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
    .slice(0, 6);

  const statusCounts = [
    'Created',
    'Waiting for Parts',
    'Ready for Service',
    'In Progress',
    'Completed',
    'Cancelled'
  ].map(status => ({
    status,
    count: repairOrders.filter(ro => ro.status === status).length
  })).filter(item => item.count > 0);

  const totalStatusOrders = repairOrders.length || 1;

  const priorities = ['Urgent', 'High', 'Medium', 'Low'].map(priority => ({
    priority,
    count: activeOrders.filter(ro => ro.priority === priority).length
  }));

  const totalPriorityOrders = activeOrders.length || 1;

  return (
    <div className="space-y-7">

      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-dark-700">
        <div>
          <p className="text-blue-400 text-xs font-semibold tracking-widest uppercase">
            Service Operations
          </p>

          <h1 className="text-2xl md:text-3xl font-bold text-white mt-2">
            Operations Dashboard
          </h1>

          <p className="text-slate-400 text-sm mt-1">
            Monitor repair orders, parts shortages and workshop activity.
          </p>
        </div>

        <button
          onClick={() => fetchDashboardData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg
            bg-blue-600 hover:bg-blue-500 active:bg-blue-700
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white text-sm font-medium shadow-sm
            transition-all duration-200"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          {refreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30
          text-red-400 flex items-center gap-2">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {/* KPI Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <StatCard
          title="Active Repair Orders"
          value={activeOrders.length}
          colorClass="border-blue-500/30"
        />

        <StatCard
          title="Blocked Orders"
          value={blockedOrders.length}
          colorClass="border-red-500/30 text-red-400"
        />

        <StatCard
          title="Ready for Service"
          value={readyOrders.length}
          colorClass="border-emerald-500/30"
        />

        <StatCard
          title="Scheduled Jobs"
          value={scheduledJobs.length}
          colorClass="border-purple-500/30"
        />

      </div>

      {/* Status and Priority Overview */}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 shadow-sm transition-all duration-200 hover:border-dark-500">

          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="text-blue-400" size={20} />

            <div>
              <h2 className="text-lg font-semibold text-white">
                Repair Order Status
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Distribution of all repair orders
              </p>
            </div>
          </div>

          <div className="space-y-4">

            {statusCounts.map(item => {
              const percentage =
                (item.count / totalStatusOrders) * 100;

              return (
                <div key={item.status}>

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-300">
                      {item.status}
                    </span>

                    <span className="text-white font-semibold">
                      {item.count}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        statusColors[item.status] || 'bg-slate-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    {percentage.toFixed(1)}% of total orders
                  </p>

                </div>
              );
            })}

            {statusCounts.length === 0 && (
              <p className="text-slate-400 text-sm">
                No repair order data available.
              </p>
            )}

          </div>
        </section>

        <section className="bg-dark-800 border border-dark-700 rounded-xl p-6 shadow-sm transition-all duration-200 hover:border-dark-500">

          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="text-purple-400" size={20} />

            <div>
              <h2 className="text-lg font-semibold text-white">
                Priority Overview
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                Active repair orders by priority
              </p>
            </div>
          </div>

          <div className="space-y-5">

            {priorities.map(item => {
              const percentage =
                (item.count / totalPriorityOrders) * 100;

              return (
                <div key={item.priority}>

                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm font-medium ${
                      priorityStyles[item.priority]
                    }`}>
                      {item.priority} Priority
                    </span>

                    <span className="text-white font-semibold text-sm">
                      {item.count} orders
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-dark-900 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        item.priority === 'Urgent'
                          ? 'bg-red-500'
                          : item.priority === 'High'
                          ? 'bg-orange-500'
                          : item.priority === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                </div>
              );
            })}

          </div>

          <div className="mt-6 pt-4 border-t border-dark-700 flex items-center gap-2">
            <Users size={17} className="text-slate-400" />
            <p className="text-xs text-slate-400">
              Total active orders: {activeOrders.length}
            </p>
          </div>

        </section>

      </div>

      {/* Repair Orders and Shortage Alerts */}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        <section className="xl:col-span-2 bg-dark-800 border
          border-dark-700 rounded-xl overflow-hidden">

          <div className="p-5 border-b border-dark-700 flex
            items-center justify-between">

            <div>
              <h2 className="text-lg font-semibold text-white">
                Recent Repair Orders
              </h2>

              <p className="text-slate-400 text-xs mt-1">
                Latest workshop repair orders
              </p>
            </div>

            <Wrench className="text-blue-400" size={20} />

          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-sm text-left">

              <thead className="text-slate-300 bg-dark-900/80 uppercase text-xs tracking-wider">
                <tr>
                  <th className="px-5 py-4">RO Number</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Vehicle</th>
                  <th className="px-5 py-4">Priority</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-dark-700">

                {recentOrders.map(ro => (
                  <tr
                    key={ro._id}
                    className="hover:bg-dark-700/50 transition-colors duration-200"
                  >

                    <td className="px-5 py-4 font-semibold text-blue-400">
                      {ro.roNumber}
                    </td>

                    <td className="px-5 py-4 text-white">
                      {ro.customer?.name || 'N/A'}
                    </td>

                    <td className="px-5 py-4 text-slate-300">
                      {ro.vehicle?.model || 'N/A'}
                    </td>

                    <td className={`px-5 py-4 font-medium ${
                      priorityStyles[ro.priority] || 'text-slate-300'
                    }`}>
                      {ro.priority || 'N/A'}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full
                        text-xs whitespace-nowrap ${
                          statusStyles[ro.status] ||
                          'bg-slate-500/10 text-slate-400'
                        }`}>
                        {ro.status}
                      </span>
                    </td>

                  </tr>
                ))}

                {repairOrders.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      No repair orders found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>
        </section>

        {/* Parts Shortage Alerts */}

        <section className="bg-dark-800 border border-dark-700
          rounded-xl overflow-hidden shadow-sm transition-all duration-200
          hover:border-dark-500">

          <div className="p-5 border-b border-dark-700 bg-dark-900/30">

            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-400" size={20} />

              <h2 className="text-lg font-semibold text-white">
                Parts Shortage Alerts
              </h2>
            </div>

            <p className="text-slate-400 text-xs mt-1">
              Repair orders waiting for parts
            </p>

          </div>

          <div className="p-4 space-y-3">

            {blockedOrders.map(ro => (
              <div
                key={ro._id}
                className="p-4 rounded-lg bg-red-500/5 border border-red-500/20
                  transition-all duration-200 hover:bg-red-500/10
                  hover:border-red-500/40"
              >

                <div className="flex justify-between items-center gap-2">
                  <span className="font-semibold text-white">
                    {ro.roNumber}
                  </span>

                  <span className="text-xs text-red-400 font-medium">
                    {ro.priority}
                  </span>
                </div>

                <p className="text-sm text-slate-300 mt-2">
                  {ro.customer?.name} — {ro.vehicle?.model}
                </p>

                <p className="text-xs text-red-400 mt-2">
                  {ro.blockedReason || 'Parts unavailable'}
                </p>

              </div>
            ))}

            {blockedOrders.length === 0 && (
              <div className="text-center p-6">
                <CheckCircle className="mx-auto text-emerald-400 mb-2" />

                <p className="text-sm text-slate-400">
                  No blocked repair orders.
                </p>
              </div>
            )}

          </div>
        </section>

      </div>

      {/* Service Bays */}

      <section className="bg-dark-800 border border-dark-700 rounded-xl
        shadow-sm overflow-hidden">

        <div className="p-5 border-b border-dark-700">

          <div className="flex items-center gap-2">
            <Activity className="text-blue-400" size={20} />

            <h2 className="text-lg font-semibold text-white">
              Service Bay Overview
            </h2>
          </div>

          <p className="text-slate-400 text-xs mt-1">
            Current status reported by the backend
          </p>

        </div>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {bays.map(bay => (
            <div
              key={bay._id}
              className="p-4 rounded-lg bg-dark-900 border border-dark-700
                transition-all duration-200 hover:border-dark-500
                hover:bg-dark-800"
            >

              <div className="flex justify-between items-center">

                <span className="text-white font-semibold">
                  {bay.bayNumber}
                </span>

                <span className={`text-xs px-2 py-1 rounded-full ${
                  bay.status === 'Available'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : bay.status === 'Occupied'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {bay.status}
                </span>

              </div>

              <p className="text-sm text-slate-400 mt-2">
                {bay.bayType}
              </p>

              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                {bay.supportedServices?.join(', ')}
              </p>

            </div>
          ))}

          {bays.length === 0 && (
            <p className="text-slate-400 text-sm">
              No service bays found.
            </p>
          )}

        </div>
      </section>

      {/* Scheduled Jobs */}

      <section className="bg-dark-800 border border-dark-700 rounded-xl
        shadow-sm overflow-hidden">

        <div className="p-5 border-b border-dark-700">

          <div className="flex items-center gap-2">
            <CalendarClock className="text-purple-400" size={20} />

            <h2 className="text-lg font-semibold text-white">
              Scheduled Workshop Jobs
            </h2>
          </div>

          <p className="text-slate-400 text-xs mt-1">
            Jobs assigned to technicians and service bays
          </p>

        </div>

        <div className="p-5 space-y-3">

          {sortedSchedules.map(schedule => (
            <div
              key={schedule._id}
              className="flex flex-wrap justify-between gap-4
                p-4 rounded-lg bg-dark-900 border border-dark-700
                transition-all duration-200 hover:border-dark-500
                hover:bg-dark-800"
            >

              <div>
                <p className="font-semibold text-white">
                  {schedule.repairOrder?.roNumber || 'Repair Order'}
                </p>

                <p className="text-sm text-slate-400 mt-1">
                  Technician: {schedule.technician?.name || 'Unassigned'}
                  {' • '}
                  Bay: {schedule.serviceBay?.bayNumber || 'Unassigned'}
                </p>
              </div>

              <div className="text-sm text-slate-300">

                <p className="flex items-center gap-2">
                  <Clock size={14} className="text-blue-400" />
                  {formatTime(schedule.scheduledStart)}
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  {schedule.status}
                  {schedule.isRescheduledByAI
                    ? ' • AI Rescheduled'
                    : ''}
                </p>

              </div>

            </div>
          ))}

          {sortedSchedules.length === 0 && (
            <p className="text-slate-400 text-sm">
              No scheduled jobs found.
            </p>
          )}

        </div>
      </section>

      {/* System Summary */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5
          shadow-sm transition-all duration-200 hover:border-dark-500">

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Package size={17} />
            Total Repair Orders
          </div>

          <p className="text-2xl font-bold text-white mt-3">
            {repairOrders.length}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5
          shadow-sm transition-all duration-200 hover:border-dark-500">

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Activity size={17} />
            Service Bays
          </div>

          <p className="text-2xl font-bold text-white mt-3">
            {bays.length}
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5
          shadow-sm transition-all duration-200 hover:border-dark-500">

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <CalendarClock size={17} />
            Total Recorded Schedules
          </div>

          <p className="text-2xl font-bold text-white mt-3">
            {schedules.length}
          </p>
        </div>

      </div>

    </div>
  );
}
