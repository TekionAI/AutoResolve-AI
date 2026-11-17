
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
  AlertTriangle,
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

  // Identify recommendations whose blocked repair order
  // is still genuinely waiting for parts.
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
      <div key={item._id} className="p-5 space-y-4">

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-white font-semibold">
              Schedule Optimization
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Recommendation ID: {item._id}
            </p>
          </div>

          <span
            className={`px-3 py-1 rounded-full border text-xs font-semibold w-fit ${getStatusStyle(
              isOutdated ? 'Outdated' : item.status
            )}`}
          >
            {isOutdated ? 'Outdated' : item.status}
          </span>
        </div>

        {isOutdated && (
          <div className="bg-slate-500/5 border border-slate-500/20 rounded-lg p-3">
            <p className="text-sm text-slate-400">
              This recommendation is no longer actionable because the
              original repair order is no longer waiting for parts.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="bg-dark-900 rounded-lg p-4 border border-red-500/20">
            <p className="text-xs text-red-400 font-semibold mb-2">
              {isApplied || isOutdated
                ? 'ORIGINAL BLOCKED REPAIR ORDER'
                : 'BLOCKED REPAIR ORDER'}
            </p>

            <h3 className="text-white font-bold">
              {blockedRO?.roNumber || 'Repair order'}
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              {blockedRO?.customer?.name || 'Customer details unavailable'}
            </p>

            <p className="text-xs text-slate-500 mt-2">
              Current status: {blockedRO?.status || 'Unavailable'}
            </p>
          </div>

          <div className="bg-dark-900 rounded-lg p-4 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 font-semibold mb-2">
              {isApplied ? 'SCHEDULED REPAIR ORDER' : 'READY TO MOVE FORWARD'}
            </p>

            <h3 className="text-white font-bold">
              {readyRO?.roNumber || 'Repair order'}
            </h3>

            <p className="text-sm text-slate-400 mt-1">
              {readyRO?.customer?.name || 'Customer details unavailable'}
            </p>

            <p className="text-xs text-slate-500 mt-2">
              {readyRO?.priority || 'Priority unavailable'} Priority
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          <div className="bg-dark-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <User size={15} />
              Technician
            </div>

            <p className="text-white text-sm font-medium mt-2 break-all">
              {typeof proposed.technician === 'object'
                ? proposed.technician?.name || technicianId
                : technicianId || 'Not available'}
            </p>
          </div>

          <div className="bg-dark-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Wrench size={15} />
              Service Bay
            </div>

            <p className="text-white text-sm font-medium mt-2 break-all">
              {typeof proposed.serviceBay === 'object'
                ? proposed.serviceBay?.bayNumber || bayId
                : bayId || 'Not available'}
            </p>
          </div>

          <div className="bg-dark-900 rounded-lg p-3">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Clock size={15} />
              {isApplied ? 'Actual Start' : 'Proposed Start'}
            </div>

            <p className="text-white text-sm font-medium mt-2">
              {formatDateTime(displayedStart)}
            </p>
          </div>

        </div>

        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <p className="text-xs text-blue-400 font-semibold mb-2">
            AI EXPLANATION
          </p>

          <p className="text-sm text-slate-300">
            {item.explanation || 'No explanation provided.'}
          </p>

          <p className="text-xs text-slate-400 mt-3">
            {isApplied ? 'Actual completion' : 'Proposed completion'}:{' '}
            {formatDateTime(displayedEnd)}
          </p>

          {isApplied && actualSchedule && (
            <p className="text-xs text-emerald-400 mt-2">
              Confirmed in service schedules
            </p>
          )}
        </div>

        {mode === 'active' && (
          <div className="flex flex-wrap justify-end gap-3">

            {item.status === 'Pending' && (
              <button
                onClick={() => approveRecommendation(item._id)}
                disabled={actionLoading === item._id}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <CheckCircle size={16} />
                {actionLoading === item._id ? 'Processing...' : 'Approve'}
              </button>
            )}

            {item.status === 'Approved' && (
              <button
                onClick={() => applyRecommendation(item._id)}
                disabled={actionLoading === item._id}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              >
                <CheckCircle size={16} />
                {actionLoading === item._id ? 'Applying...' : 'Apply Schedule'}
              </button>
            )}

          </div>
        )}

        {isApplied && (
          <div className="flex justify-end">
            <span className="text-emerald-400 text-sm font-semibold flex items-center gap-2">
              <CheckCircle size={17} />
              Schedule Successfully Applied
            </span>
          </div>
        )}

      </div>
    );
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CalendarClock className="text-blue-400" />
            Smart Scheduling
          </h1>

          <p className="text-slate-400 text-sm mt-2">
            AI-powered repair order sequencing and service bay allocation
          </p>
        </div>

        <button
          onClick={runOptimization}
          disabled={optimizing}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          {optimizing ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Zap size={18} />
          )}

          {optimizing ? 'Optimizing...' : 'Run AI Optimization'}
        </button>
      </div>

      {/* Summary Cards */}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Active Schedules</p>
          <h2 className="text-3xl font-bold text-white mt-2">
            {activeSchedules.length}
          </h2>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Pending Approval</p>
          <h2 className="text-3xl font-bold text-amber-400 mt-2">
            {pendingCount}
          </h2>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Approved</p>
          <h2 className="text-3xl font-bold text-blue-400 mt-2">
            {approvedCount}
          </h2>
        </div>

        <div className="bg-dark-800 border border-dark-700 rounded-xl p-5">
          <p className="text-slate-400 text-sm">Applied</p>
          <h2 className="text-3xl font-bold text-emerald-400 mt-2">
            {appliedCount}
          </h2>
        </div>

      </div>

      {/* Active Recommendations */}

      <section className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-dark-700">
          <h2 className="text-lg font-bold text-white">
            Active AI Scheduling Recommendations
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Review actionable recommendations for repair orders currently waiting for parts.
          </p>
        </div>

        {activeRecommendations.length === 0 ? (
          <div className="text-center py-16 px-5">
            <CheckCircle className="mx-auto text-emerald-400 mb-3" size={36} />

            <h3 className="text-white font-semibold">
              No active recommendations
            </h3>

            <p className="text-slate-400 text-sm mt-2">
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

      {/* Recommendation History */}

      <section className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">

        <details>
          <summary className="p-5 cursor-pointer list-none flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <History className="text-slate-400" size={21} />

              <div>
                <h2 className="text-lg font-bold text-white">
                  Recommendation History
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Applied recommendations and outdated recommendations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs bg-dark-900 text-slate-300 px-3 py-1 rounded-full">
                {historyRecommendations.length} records
              </span>

              <ChevronDown className="text-slate-400" size={20} />
            </div>
          </summary>

          <div className="border-t border-dark-700">

            {historyRecommendations.length === 0 ? (
              <p className="text-center text-slate-400 py-10">
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

      {/* Existing Service Schedules */}

      <section className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden">

        <div className="p-5 border-b border-dark-700">
          <h2 className="text-lg font-bold text-white">
            Existing Service Schedules
          </h2>

          <p className="text-sm text-slate-400 mt-1">
            Schedules currently recorded in the system.
          </p>
        </div>

        {schedules.length === 0 ? (
          <p className="text-center text-slate-400 py-10">
            No schedules found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">

              <thead className="bg-dark-900 text-slate-400">
                <tr>
                  <th className="p-4">Repair Order</th>
                  <th className="p-4">Technician</th>
                  <th className="p-4">Bay</th>
                  <th className="p-4">Start</th>
                  <th className="p-4">End</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-dark-700">
                {schedules.map((schedule) => (
                  <tr key={schedule._id} className="text-slate-300">

                    <td className="p-4 font-medium text-white">
                      {schedule.repairOrder?.roNumber ||
                        getId(schedule.repairOrder)}
                    </td>

                    <td className="p-4">
                      {schedule.technician?.name ||
                        getId(schedule.technician)}
                    </td>

                    <td className="p-4">
                      {schedule.serviceBay?.bayNumber ||
                        getId(schedule.serviceBay)}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {formatDateTime(schedule.scheduledStart)}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      {formatDateTime(schedule.scheduledEnd)}
                    </td>

                    <td className="p-4">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">
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
