
import React, { useEffect, useState } from 'react';
import useAutoRefresh, { notifyDataChanged } from '../hooks/useAutoRefresh';
import {
  CalendarClock,
  Zap,
  RefreshCw,
  CheckCircle,
  Clock,
  User,
  Wrench,
  History,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-toastify';

import { scheduleService } from '../services/scheduleService';
import { recommendationService } from '../services/recommendationService';
import { repairOrderService } from '../services/repairOrderService';
import Loading from '../components/common/Loading';

const DEALERSHIP_ID = '6af9e85fa9791b0ffed2cabf';

const getArray = (response) => {
  const data = response?.data?.data ?? response?.data;
  return Array.isArray(data) ? data : [];
};

const getId = (value) => {
  if (!value) return '';
  return typeof value === 'object' ? value._id || value.id || '' : value;
};

const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';

  return new Date(value).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata'
  });
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'Applied':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    case 'Approved':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'Outdated':
      return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    default:
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
};

export default function Scheduling() {
  const [schedules, setSchedules] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [repairOrders, setRepairOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const repairOrderMap = Object.fromEntries(
    repairOrders.map((ro) => [ro._id, ro])
  );

  const loadData = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const [scheduleRes, recommendationRes, repairOrderRes] =
        await Promise.all([
          scheduleService.getSchedules(),
          recommendationService.getRecommendations(),
          repairOrderService.getAll()
        ]);

      setSchedules(getArray(scheduleRes));

      const allRecommendations = getArray(recommendationRes);

      setRecommendations(
        allRecommendations.filter(
          (item) =>
            item.recommendationType === 'Schedule Optimization'
        )
      );

      setRepairOrders(getArray(repairOrderRes));
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to load scheduling data'
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData(true);
  }, []);

  useAutoRefresh(loadData);

  const runOptimization = async () => {
    setOptimizing(true);

    try {
      const response = await scheduleService.optimize(DEALERSHIP_ID);
      const generated = getArray(response);

      setRecommendations((previous) => {
        const updated = [...previous];

        generated.forEach((item) => {
          const index = updated.findIndex(
            (existing) => existing._id === item._id
          );

          if (index >= 0) {
            updated[index] = item;
          } else {
            updated.push(item);
          }
        });

        return updated;
      });

      toast.success(
        generated.length
          ? `${generated.length} scheduling recommendation(s) generated`
          : 'Optimization completed. No new recommendations found.'
      );

      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Schedule optimization failed'
      );
    } finally {
      setOptimizing(false);
    }
  };

  const approveRecommendation = async (id) => {
    setActionLoading(id);

    try {
      await recommendationService.approveRecommendation(id, 'Approved');
      toast.success('Scheduling recommendation approved');
      await loadData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Approval failed');
    } finally {
      setActionLoading('');
    }
  };

  const applyRecommendation = async (id) => {
    setActionLoading(id);

    try {
      await scheduleService.applyRecommendation(id);
      toast.success('Schedule applied successfully');
      await loadData();
      notifyDataChanged();
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Unable to apply recommendation'
      );
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <Loading />;
  }

  const isStillBlocked = (item) => {
    const blockedRO = repairOrderMap[getId(item.repairOrder)];

    return (
      blockedRO?.isBlocked === true &&
      blockedRO?.status === 'Waiting for Parts'
    );
  };

  const activeRecommendations = recommendations.filter(
    (item) =>
      ['Pending', 'Approved'].includes(item.status) &&
      isStillBlocked(item)
  );

  const outdatedRecommendations = recommendations.filter(
    (item) =>
      ['Pending', 'Approved'].includes(item.status) &&
      !isStillBlocked(item)
  );

  const appliedRecommendations = recommendations.filter(
    (item) => item.status === 'Applied'
  );

  const historyRecommendations = [
    ...appliedRecommendations,
    ...outdatedRecommendations
  ];

  const pendingCount = activeRecommendations.filter(
    (item) => item.status === 'Pending'
  ).length;

  const approvedCount = activeRecommendations.filter(
    (item) => item.status === 'Approved'
  ).length;

  const appliedCount = appliedRecommendations.length;

  const activeSchedules = schedules.filter(
    (item) =>
      ['Scheduled', 'In Progress', 'Delayed'].includes(item.status)
  );

  const renderRecommendation = (item, mode = 'active') => {
    const proposed = item.proposedSchedule || {};

    const blockedRO = repairOrderMap[getId(item.repairOrder)];

    const readyRO = repairOrderMap[
      getId(proposed.repairOrderToMoveForward)
    ];

    const technicianId = getId(proposed.technician);
    const bayId = getId(proposed.serviceBay);

    const isApplied = item.status === 'Applied';
    const isOutdated = mode === 'outdated';

    const actualSchedule = schedules.find(
      (schedule) =>
        getId(schedule.repairOrder) ===
        getId(proposed.repairOrderToMoveForward)
    );

    const displayedStart = isApplied
      ? actualSchedule?.scheduledStart || readyRO?.scheduledStart || proposed.proposedStart
      : proposed.proposedStart;

    const displayedEnd = isApplied
      ? actualSchedule?.scheduledEnd || readyRO?.estimatedCompletion || proposed.proposedEnd
      : proposed.proposedEnd;

    return (
      <div
        key={item._id}
        className="space-y-5 p-5 transition-colors hover:bg-dark-700/10"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-white">
              Schedule Optimization
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Recommendation ID: {item._id}
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
              isOutdated ? 'Outdated' : item.status
            )}`}
          >
            {isOutdated ? 'Outdated' : item.status}
          </span>
        </div>

        {isOutdated && (
          <div className="rounded-lg border border-slate-500/20 bg-slate-500/5 p-3">
            <p className="text-sm text-slate-400">
              This recommendation is no longer actionable because the
              original repair order is no longer waiting for parts.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-red-500/20 bg-dark-900 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">
              {isApplied || isOutdated
                ? 'Original Blocked Repair Order'
                : 'Blocked Repair Order'}
            </p>

            <h3 className="font-bold text-white">
              {blockedRO?.roNumber || 'Repair order'}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {blockedRO?.customer?.name || 'Customer details unavailable'}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Current status: {blockedRO?.status || 'Unavailable'}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-dark-900 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              {isApplied ? 'Scheduled Repair Order' : 'Ready to Move Forward'}
            </p>

            <h3 className="font-bold text-white">
              {readyRO?.roNumber || 'Repair order'}
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              {readyRO?.customer?.name || 'Customer details unavailable'}
            </p>

            <p className="mt-2 text-xs text-slate-500">
              {readyRO?.priority || 'Priority unavailable'} Priority
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-dark-700 bg-dark-900/60 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <User size={15} />
              Technician
            </div>

            <p className="mt-2 break-all text-sm font-medium text-white">
              {typeof proposed.technician === 'object'
                ? proposed.technician?.name || technicianId
                : technicianId || 'Not available'}
            </p>
          </div>

          <div className="rounded-lg border border-dark-700 bg-dark-900/60 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Wrench size={15} />
              Service Bay
            </div>

            <p className="mt-2 break-all text-sm font-medium text-white">
              {typeof proposed.serviceBay === 'object'
                ? proposed.serviceBay?.bayNumber || bayId
                : bayId || 'Not available'}
            </p>
          </div>

          <div className="rounded-lg border border-dark-700 bg-dark-900/60 p-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Clock size={15} />
              {isApplied ? 'Actual Start' : 'Proposed Start'}
            </div>

            <p className="mt-2 text-sm font-medium text-white">
              {formatDateTime(displayedStart)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-400">
            AI Explanation
          </p>

          <p className="text-sm leading-relaxed text-slate-300">
            {item.explanation || 'No explanation provided.'}
          </p>

          <p className="mt-3 text-xs text-slate-400">
            {isApplied ? 'Actual completion' : 'Proposed completion'}:{' '}
            {formatDateTime(displayedEnd)}
          </p>

          {isApplied && actualSchedule && (
            <p className="mt-2 flex items-center gap-2 text-xs font-medium text-emerald-400">
              <CheckCircle size={14} />
              Confirmed in service schedules
            </p>
          )}
        </div>

        {mode === 'active' && (
          <div className="flex flex-wrap justify-end gap-3 border-t border-dark-700 pt-4">
            {item.status === 'Pending' && (
              <button
                onClick={() => approveRecommendation(item._id)}
                disabled={actionLoading === item._id}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {actionLoading === item._id ? 'Processing...' : 'Approve'}
              </button>
            )}

            {item.status === 'Approved' && (
              <button
                onClick={() => applyRecommendation(item._id)}
                disabled={actionLoading === item._id}
                className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle size={16} />
                {actionLoading === item._id ? 'Applying...' : 'Apply Schedule'}
              </button>
            )}
          </div>
        )}

        {isApplied && (
          <div className="flex justify-end border-t border-dark-700 pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-emerald-400">
              <CheckCircle size={17} />
              Schedule Successfully Applied
            </span>
          </div>
        )}
      </div>
    );
  };

  const summaryCards = [
    {
      label: 'Active Schedules',
      value: activeSchedules.length,
      color: 'text-white',
      icon: CalendarClock
    },
    {
      label: 'Pending Approval',
      value: pendingCount,
      color: 'text-amber-400',
      icon: Clock
    },
    {
      label: 'Approved',
      value: approvedCount,
      color: 'text-blue-400',
      icon: CheckCircle
    },
    {
      label: 'Applied',
      value: appliedCount,
      color: 'text-emerald-400',
      icon: CheckCircle
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-white">
            <CalendarClock className="text-blue-400" />
            Smart Scheduling
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            AI-powered repair order sequencing and service bay allocation
          </p>
        </div>

        <button
          onClick={runOptimization}
          disabled={optimizing}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-500 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {optimizing ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Zap size={18} />
          )}

          {optimizing ? 'Optimizing...' : 'Run AI Optimization'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-dark-700 bg-dark-800 p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-dark-500 hover:shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-400">
                  {card.label}
                </p>
                <Icon size={20} className={card.color} />
              </div>

              <h2 className={`mt-3 text-3xl font-bold tracking-tight ${card.color}`}>
                {card.value}
              </h2>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800 shadow-sm">
        <div className="border-b border-dark-700 p-5">
          <h2 className="text-lg font-semibold text-white">
            Active AI Scheduling Recommendations
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Review actionable recommendations for repair orders currently waiting for parts.
          </p>
        </div>

        {activeRecommendations.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <CheckCircle className="mx-auto mb-3 text-emerald-400" size={36} />

            <h3 className="font-semibold text-white">
              No active recommendations
            </h3>

            <p className="mt-2 text-sm text-slate-400">
              There are currently no actionable scheduling recommendations.
              Run AI optimization to identify new opportunities.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {activeRecommendations.map((item) =>
              renderRecommendation(item, 'active')
            )}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800 shadow-sm">
        <details>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 transition-colors hover:bg-dark-700/30">
            <div className="flex items-center gap-3">
              <History className="text-slate-400" size={21} />

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Recommendation History
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Applied recommendations and outdated recommendations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-dark-900 px-3 py-1 text-xs text-slate-300">
                {historyRecommendations.length} records
              </span>

              <ChevronDown className="text-slate-400" size={20} />
            </div>
          </summary>

          <div className="border-t border-dark-700">
            {historyRecommendations.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                No recommendation history available yet.
              </p>
            ) : (
              <div className="divide-y divide-dark-700">
                {appliedRecommendations.map((item) =>
                  renderRecommendation(item, 'applied')
                )}

                {outdatedRecommendations.map((item) =>
                  renderRecommendation(item, 'outdated')
                )}
              </div>
            )}
          </div>
        </details>
      </section>

      <section className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800 shadow-sm">
        <div className="border-b border-dark-700 p-5">
          <h2 className="text-lg font-semibold text-white">
            Existing Service Schedules
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Schedules currently recorded in the system.
          </p>
        </div>

        {schedules.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            No schedules found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-dark-900 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4">Repair Order</th>
                  <th className="whitespace-nowrap px-5 py-4">Technician</th>
                  <th className="whitespace-nowrap px-5 py-4">Bay</th>
                  <th className="whitespace-nowrap px-5 py-4">Start</th>
                  <th className="whitespace-nowrap px-5 py-4">End</th>
                  <th className="whitespace-nowrap px-5 py-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-dark-700">
                {schedules.map((schedule) => (
                  <tr
                    key={schedule._id}
                    className="text-slate-300 transition-colors hover:bg-dark-700/30"
                  >
                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-blue-400">
                      {schedule.repairOrder?.roNumber ||
                        getId(schedule.repairOrder)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {schedule.technician?.name ||
                        getId(schedule.technician)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {schedule.serviceBay?.bayNumber ||
                        getId(schedule.serviceBay)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatDateTime(schedule.scheduledStart)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      {formatDateTime(schedule.scheduledEnd)}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span className="inline-flex rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                        {schedule.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
