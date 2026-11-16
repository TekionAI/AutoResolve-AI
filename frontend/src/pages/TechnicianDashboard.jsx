
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

const formatDate = (date) => {
  if (!date) return 'Not scheduled';

  return new Date(date).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

const getStatusStyle = (status) => {
  const styles = {
    'Ready for Service': 'bg-blue-500/10 text-blue-400',
    'In Progress': 'bg-yellow-500/10 text-yellow-400',
    'Completed': 'bg-green-500/10 text-green-400',
    'Waiting for Parts': 'bg-red-500/10 text-red-400',
    'Created': 'bg-gray-500/10 text-gray-400'
  };

  return styles[status] || 'bg-gray-500/10 text-gray-400';
};

export default function TechnicianDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');

  const fetchDashboard = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

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
    fetchDashboard();
  }, [fetchDashboard]);

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
          <h1 className="text-2xl font-bold text-white">
            Technician Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            View your assigned jobs and update their progress.
          </p>
        </div>

        <button
          onClick={() => fetchDashboard(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-lg bg-dark-700 px-4 py-2 text-sm text-white hover:bg-dark-600 disabled:opacity-50"
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

      <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
        <h2 className="text-lg font-semibold text-white">
          Welcome, {technician.name || 'Technician'}
        </h2>

        <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-400">
          <span>
            Employee ID: {technician.employeeId || 'N/A'}
          </span>
          <span>
            Shift: {technician.shiftStart || '09:00'} – {technician.shiftEnd || '18:00'}
          </span>
          <span>
            Availability: {technician.availabilityStatus || 'N/A'}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(technician.skills || []).map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-400"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-xl border border-dark-700 bg-dark-800 p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{card.label}</p>
                <Icon size={20} className={card.color} />
              </div>

              <p className="mt-3 text-3xl font-bold text-white">
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

      <div className="rounded-xl border border-dark-700 bg-dark-800">
        <div className="flex items-center justify-between border-b border-dark-700 p-5">
          <div>
            <h2 className="text-lg font-semibold text-white">
              My Assigned Jobs
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Jobs assigned to your technician account.
            </p>
          </div>

          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
            {jobs.length} Jobs
          </span>
        </div>

        {jobs.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Briefcase size={32} className="mx-auto mb-3 opacity-50" />
            No jobs assigned to you yet.
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
                <div key={job._id} className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-white">
                        {job.roNumber || 'Repair Order'}
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        {job.customer?.name || 'Customer'} ·{' '}
                        {job.vehicle?.make || ''} {job.vehicle?.model || ''}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(job.status)}`}
                    >
                      {job.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-gray-500">Operation</p>
                      <p className="mt-1 text-gray-200">
                        {job.operation || 'N/A'}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Service Bay</p>
                      <p className="mt-1 text-gray-200">
                        {job.assignedBay?.bayNumber || 'Not assigned'}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-500">Scheduled Start</p>
                      <p className="mt-1 flex items-center gap-2 text-gray-200">
                        <CalendarDays size={15} />
                        {formatDate(job.scheduledStart)}
                      </p>
                    </div>
                  </div>

                  {job.requiredParts?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium text-gray-500">
                        REQUIRED PARTS
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {job.requiredParts.map((item, index) => (
                          <span
                            key={item._id || index}
                            className="rounded-md bg-dark-700 px-3 py-1.5 text-xs text-gray-300"
                          >
                            {item.part?.name || item.part?.partName || 'Part'} · Qty: {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isBlocked && (
                    <p className="text-sm text-red-400">
                      Blocked: {job.blockedReason || 'This job is blocked.'}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-700 pt-4">
                    <p className="text-xs text-gray-500">
                      Estimated completion: {formatDate(job.estimatedCompletion)}
                    </p>

                    <div>
                      {isReady && (
                        <button
                          onClick={() => handleJobAction(job._id, 'start')}
                          disabled={!!actionLoading || isBlocked || !!isScheduled}
                          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:opacity-40"
                        >
                          <CheckCheck size={16} />
                          {actionLoading === actionKey
                            ? 'Completing...'
                            : 'Complete Job'}
                        </button>
                      )}

                      {isCompleted && (
                        <span className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle size={17} />
                          Job Completed
                        </span>
                      )}

                      {!isReady && !isInProgress && !isCompleted && (
                        <span className="text-sm text-gray-500">
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
