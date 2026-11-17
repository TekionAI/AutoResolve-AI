
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Briefcase,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  CheckCheck,
  CalendarDays,
  Wrench
} from 'lucide-react';

import { technicianService } from '../services/technicianService';
import Loading from '../components/common/Loading';
import StatusBadge from '../components/common/StatusBadge';
import useAutoRefresh, { notifyDataChanged } from '../hooks/useAutoRefresh';

const formatDate = (date) => {
  if (!date) return 'Not scheduled';

  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

export default function TechnicianDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async (showRefresh = false, showLoading = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      if (showLoading) setLoading(true);

      setError('');

      const response = await technicianService.getMyDashboard();
      setDashboard(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load technician dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard(false, true);
  }, [fetchDashboard]);

  useAutoRefresh(fetchDashboard);

  const handleJobAction = async (repairOrderId, action) => {
    const actionKey = `${repairOrderId}-${action}`;

    try {
      setActionLoading(actionKey);
      setError('');

      if (action === 'start') {
        await technicianService.startJob(repairOrderId);
      } else {
        await technicianService.completeJob(repairOrderId);
      }

      await fetchDashboard(true);
      notifyDataChanged();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update job status.'
      );
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!dashboard) {
    return (
      <div className="p-6 text-red-400">
        {error || 'Technician dashboard data is unavailable.'}
        <button
          onClick={() => fetchDashboard()}
          className="ml-3 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const technician = dashboard.technician || {};
  const summary = dashboard.summary || {};
  const jobs = dashboard.jobs || [];

  const statCards = [
    {
      label: 'Total Jobs',
      value: summary.totalJobs || 0,
      icon: Briefcase,
      color: 'text-blue-400'
    },
    {
      label: 'Pending Jobs',
      value: summary.pendingJobs || 0,
      icon: Clock,
      color: 'text-yellow-400'
    },
    {
      label: 'In Progress',
      value: summary.inProgressJobs || 0,
      icon: Wrench,
      color: 'text-purple-400'
    },
    {
      label: 'Completed',
      value: summary.completedJobs || 0,
      icon: CheckCircle,
      color: 'text-green-400'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Technician Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            View your assigned jobs and update their progress.
          </p>
        </div>

        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg border border-dark-600 bg-dark-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-dark-600 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={refreshing ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <div className="rounded-xl border border-dark-700 bg-dark-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-400">
              Technician Profile
            </p>
            <h2 className="text-xl font-semibold text-white">
              Welcome, {technician.name || 'Technician'}
            </h2>
          </div>

          <span className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400">
            {technician.availabilityStatus || 'Availability N/A'}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-dark-700 pt-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-slate-500">Employee ID</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {technician.employeeId || 'N/A'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Shift Timing</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {technician.shiftStart || '09:00'} - {technician.shiftEnd || '18:00'}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Availability</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {technician.availabilityStatus || 'N/A'}
            </p>
          </div>
        </div>

        {(technician.skills || []).length > 0 && (
          <div className="mt-5 border-t border-dark-700 pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Skills
            </p>
            <div className="flex flex-wrap gap-2">
              {technician.skills.map((skill, index) => (
                <span
                  key={`${skill}-${index}`}
                  className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
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

              <p className="mt-3 text-3xl font-bold tracking-tight text-white">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      {summary.blockedJobs > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
          <AlertTriangle size={22} />
          <div>
            <p className="font-semibold">Blocked Jobs</p>
            <p className="text-sm">
              You have {summary.blockedJobs} job(s) waiting for parts or resolution.
            </p>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-700 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              My Assigned Jobs
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Jobs assigned to your technician account.
            </p>
          </div>

          <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm font-medium text-blue-400">
            {jobs.length} Jobs
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium text-slate-300">No jobs assigned</p>
            <p className="mt-1 text-sm">
              New assignments will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-dark-700">
            {jobs.map((job) => {
              const isReady = job.status === 'Ready for Service';
              const isInProgress = job.status === 'In Progress';
              const isCompleted = job.status === 'Completed';

              const isScheduled =
                job.scheduledStart &&
                new Date() < new Date(job.scheduledStart);

              const isBlocked = job.isBlocked;

              const actionKey = `${job._id}-${isInProgress ? 'complete' : 'start'}`;

              return (
                <div
                  key={job._id}
                  className="space-y-4 p-5 transition-colors hover:bg-dark-700/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {job.roNumber || 'Repair Order'}
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        {job.customer?.name || 'Customer'} {' | '}
                        {job.vehicle?.make || ''} {job.vehicle?.model || ''}
                      </p>
                    </div>

                    <StatusBadge status={job.status} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Operation
                      </p>
                      <p className="mt-1 text-slate-200">
                        {job.operation || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Service Bay
                      </p>
                      <p className="mt-1 text-slate-200">
                        {job.assignedBay?.bayNumber || 'Not assigned'}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Scheduled Start
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-slate-200">
                        <CalendarDays size={15} className="text-slate-500" />
                        {formatDate(job.scheduledStart)}
                      </p>
                    </div>
                  </div>

                  {job.requiredParts?.length > 0 && (
                    <div className="rounded-lg border border-dark-700 bg-dark-900/40 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Required Parts
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {job.requiredParts.map((item, index) => (
                          <span
                            key={item._id || index}
                            className="rounded-md border border-dark-600 bg-dark-700 px-3 py-1.5 text-xs text-slate-300"
                          >
                            {item.part?.name || item.part?.partName || 'Part'}
                            {' | '}Qty: {item.requiredQuantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isBlocked && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-400">
                      <div className="flex items-center gap-2 font-medium">
                        <AlertTriangle size={16} />
                        Job Blocked
                      </div>
                      <p className="mt-1">
                        {job.blockedReason || 'This job is blocked.'}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-700 pt-4">
                    <p className="text-xs text-slate-500">
                      Estimated completion: {formatDate(job.estimatedCompletion)}
                    </p>

                    <div>
                      {isReady && (
                        <button
                          onClick={() => handleJobAction(job._id, 'start')}
                          disabled={!!actionLoading || isBlocked || !!isScheduled}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Play size={15} />
                          {actionLoading === actionKey
                            ? 'Starting...'
                            : isScheduled
                              ? 'Not Yet Scheduled'
                              : 'Start Job'}
                        </button>
                      )}

                      {isInProgress && (
                        <button
                          onClick={() => handleJobAction(job._id, 'complete')}
                          disabled={!!actionLoading}
                          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <CheckCheck size={16} />
                          {actionLoading === actionKey
                            ? 'Completing...'
                            : 'Complete Job'}
                        </button>
                      )}

                      {isCompleted && (
                        <span className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                          <CheckCircle size={17} />
                          Job Completed
                        </span>
                      )}

                      {!isReady && !isInProgress && !isCompleted && (
                        <span className="text-sm text-slate-500">
                          No action available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
