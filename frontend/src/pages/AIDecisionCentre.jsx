
import React, { useEffect, useState } from 'react';
import {
  BrainCircuit,
  CheckCircle,
  RefreshCw,
  AlertTriangle,
  Search,
  Play,
  Clock,
  Package,
  IndianRupee,
  Truck,
  ShieldCheck,
  Award
} from 'lucide-react';
import { toast } from 'react-toastify';

import { recommendationService } from '../services/recommendationService';
import { repairOrderService } from '../services/repairOrderService';
import Loading from '../components/common/Loading';

import useAutoRefresh, { notifyDataChanged } from '../hooks/useAutoRefresh';

const extractData = (response) => {
  return response?.data?.data ?? response?.data ?? [];
};

export default function AIDecisionCentre() {
  const [repairOrders, setRepairOrders] = useState([]);
  const [selectedRO, setSelectedRO] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [processingId, setProcessingId] = useState('');
  const [error, setError] = useState('');

  const fetchRepairOrders = async () => {
    try {
      const res = await repairOrderService.getAll();
      const data = extractData(res);

      setRepairOrders(
        data.filter(ro => ro.isBlocked === true)
      );
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Unable to load blocked repair orders.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepairOrders();
  }, []);

  useAutoRefresh(fetchRepairOrders);

  const generateRecommendations = async (e) => {
    e.preventDefault();

    if (!selectedRO) {
      toast.error('Select a blocked repair order first.');
      return;
    }

    setGenerating(true);
    setError('');
    setRecommendations([]);

    try {
      const res =
        await recommendationService.generateSourcingRecs(selectedRO);

      const items = res.data?.recommendations || [];

      setRecommendations(items);

      if (items.length === 0) {
        toast.info('No sourcing recommendations were generated.');
      } else {
        toast.success('Sourcing recommendations generated.');
      }
    } catch (err) {
      console.error('Recommendation generation error:', err);

      setError(
        err.response?.data?.message ||
        'Unable to generate recommendations.'
      );

      toast.error('Recommendation generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const approveRecommendation = async (id) => {
    if (!id) return;

    setProcessingId(id);

    try {
      const res =
        await recommendationService.approveRecommendation(id);

      toast.success(
        res.data?.message || 'Recommendation approved.'
      );

      setRecommendations(prev =>
        prev.map(rec =>
          rec._id === id
            ? { ...rec, status: 'Approved' }
            : rec
        )
      );
    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        'Could not approve recommendation.'
      );
    } finally {
      setProcessingId('');
    }
  };

  const applyRecommendation = async (id) => {
    if (!id) return;

    setProcessingId(id);

    try {
      const res =
        await recommendationService.applyRecommendation(id);

      toast.success(
        res.data?.message ||
        'Recommendation applied successfully.'
      );

      setRecommendations(prev =>
        prev.map(rec =>
          rec._id === id
            ? { ...rec, status: 'Applied' }
            : rec
        )
      );

      await fetchRepairOrders();
      notifyDataChanged();

    } catch (err) {
      console.error(err);

      toast.error(
        err.response?.data?.message ||
        'Could not apply recommendation.'
      );
    } finally {
      setProcessingId('');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400">
            <BrainCircuit size={30} />
          </div>

          <div>
            <p className="text-xs font-semibold tracking-widest text-blue-400">
              INTELLIGENT OPERATIONS
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">
              AI Decision Centre
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Identify sourcing options and resolve parts shortages.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRepairOrders}
          className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-dark-500 hover:bg-dark-700"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Blocked Repair Orders */}
      <section className="rounded-xl border border-dark-700 bg-dark-800 p-5 shadow-sm md:p-6">

        <div className="mb-2 flex items-center gap-3">
          <div className="rounded-lg bg-red-500/10 p-2 text-red-400">
            <AlertTriangle size={19} />
          </div>

          <h2 className="text-lg font-semibold text-white">
            Blocked Repair Orders
          </h2>

          <span className="ml-auto rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-400">
            {repairOrders.length} Blocked
          </span>
        </div>

        <p className="mb-5 text-sm text-slate-400">
          Select a repair order waiting for parts to generate sourcing recommendations.
        </p>

        {repairOrders.length === 0 ? (
          <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-5 text-center">
            <CheckCircle className="mx-auto mb-2 text-emerald-400" size={25} />
            <p className="text-sm font-medium text-slate-300">
              No blocked repair orders found.
            </p>
          </div>
        ) : (
          <form
            onSubmit={generateRecommendations}
            className="flex flex-col gap-3 md:flex-row"
          >
            <select
              value={selectedRO}
              onChange={e => setSelectedRO(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-dark-600 bg-dark-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-blue-500"
            >
              <option value="">Select a blocked repair order</option>

              {repairOrders.map(ro => (
                <option key={ro._id} value={ro._id}>
                  {ro.roNumber} — {ro.customer?.name || 'Customer'} — {ro.blockedReason || 'Parts unavailable'}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={generating || !selectedRO}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? (
                <RefreshCw size={17} className="animate-spin" />
              ) : (
                <Search size={17} />
              )}
              {generating ? 'Generating...' : 'Generate Solution'}
            </button>
          </form>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          <AlertTriangle size={18} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Recommendations */}
      {recommendations.map((rec, index) => {
        const id = rec._id;
        const status = rec.status || 'Pending';

        const sourcingOptions = rec.sourcingOptions || [];

        const bestSource = sourcingOptions.length
          ? [...sourcingOptions].sort((a, b) => b.score - a.score)[0]
          : null;

        return (
          <section
            key={id || index}
            className="overflow-hidden rounded-xl border border-dark-700 bg-dark-800 shadow-sm"
          >

            {/* Recommendation Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dark-700 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
                  <BrainCircuit size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Sourcing Recommendation {index + 1}
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    AI-assisted sourcing analysis
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  status === 'Applied'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : status === 'Approved'
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                {status}
              </span>
            </div>

            <div className="space-y-6 p-5">

              {/* AI Explanation */}
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Award className="text-blue-400" size={20} />

                  <h3 className="font-semibold text-white">
                    AI Recommended Decision
                  </h3>
                </div>

                <p className="text-sm leading-6 text-slate-300">
                  {rec.explanation || 'No explanation available.'}
                </p>

                {bestSource && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-blue-500/10 pt-3">
                    <span className="text-xs text-slate-400">
                      Highest-ranked source
                    </span>
                    <span className="text-sm font-semibold text-blue-400">
                      {bestSource.sourceName}
                    </span>
                    <span className="rounded-md bg-blue-500/10 px-2 py-1 text-xs font-semibold text-blue-300">
                      {bestSource.score} points
                    </span>
                  </div>
                )}
              </div>

              {/* Sourcing Options */}
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-white">
                      Alternative Sourcing Options
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Compare eligible sources before applying the recommendation
                    </p>
                  </div>

                  <span className="rounded-md border border-dark-700 bg-dark-900 px-3 py-1.5 text-xs text-slate-400">
                    {sourcingOptions.length} options evaluated
                  </span>
                </div>

                {sourcingOptions.length === 0 ? (
                  <div className="rounded-lg border border-dark-700 bg-dark-900/50 p-5 text-center">
                    <Package className="mx-auto mb-2 text-slate-500" size={24} />
                    <p className="text-sm text-slate-400">
                      No sourcing options available.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-dark-700">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-dark-900 text-xs uppercase tracking-wide text-slate-400">
                        <tr>
                          <th className="px-4 py-4">Source</th>
                          <th className="px-4 py-4">Type</th>
                          <th className="px-4 py-4">Stock</th>
                          <th className="px-4 py-4">Total Cost</th>
                          <th className="px-4 py-4">Delivery</th>
                          <th className="px-4 py-4">Reliability</th>
                          <th className="px-4 py-4">Score</th>
                        </tr>
                      </thead>

                      <tbody>
                        {sourcingOptions
                          .slice()
                          .sort((a, b) => b.score - a.score)
                          .map(option => {
                            const isBest = bestSource?._id === option._id;

                            return (
                              <tr
                                key={option._id}
                                className={`border-t border-dark-700 transition-colors hover:bg-dark-700/30 ${
                                  isBest ? 'bg-blue-500/5' : ''
                                }`}
                              >
                                <td className="px-4 py-4">
                                  <div className="font-semibold text-white">
                                    {option.sourceName}
                                  </div>

                                  <div className="mt-1 text-xs text-slate-500">
                                    {option.location}
                                  </div>

                                  {isBest && (
                                    <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-400">
                                      <CheckCircle size={12} />
                                      Recommended
                                    </span>
                                  )}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                  {option.sourceType}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                  {option.availableQuantity} units
                                </td>

                                <td className="px-4 py-4 font-semibold text-white">
                                  ₹{(
                                    option.unitPrice * option.quantity
                                  ).toLocaleString('en-IN')}
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                  <span className="flex items-center gap-2">
                                    <Clock size={14} className="text-slate-500" />
                                    {option.estimatedDeliveryHours} hrs
                                  </span>
                                </td>

                                <td className="px-4 py-4 text-slate-300">
                                  <span className="flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-slate-500" />
                                    {option.reliabilityScore}%
                                  </span>
                                </td>

                                <td className="px-4 py-4 font-bold text-blue-400">
                                  {Number(option.score).toFixed(2)}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Shortage Summary */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-dark-700 bg-dark-900/70 p-4 transition-colors hover:border-dark-500">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                    <Package size={17} />
                    Required Quantity
                  </div>

                  <p className="text-2xl font-bold text-white">
                    {rec.shortageDetails?.requiredQuantity ?? 0}
                  </p>
                </div>

                <div className="rounded-xl border border-dark-700 bg-dark-900/70 p-4 transition-colors hover:border-dark-500">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                    <Truck size={17} />
                    Recommended Delivery
                  </div>

                  <p className="text-2xl font-bold text-white">
                    {rec.proposedSource?.estimatedDeliveryHours ?? 0} hrs
                  </p>
                </div>

                <div className="rounded-xl border border-dark-700 bg-dark-900/70 p-4 transition-colors hover:border-dark-500">
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-400">
                    <IndianRupee size={17} />
                    Recommended Total Cost
                  </div>

                  <p className="text-2xl font-bold text-white">
                    ₹{Number(
                      rec.proposedSource?.estimatedCost ?? 0
                    ).toLocaleString('en-IN')}
                  </p>
                </div>

              </div>

              {/* Manager Actions */}
              {id && (
                <div className="flex flex-wrap items-center gap-3 border-t border-dark-700 pt-5">

                  {status !== 'Approved' && status !== 'Applied' && (
                    <button
                      onClick={() => approveRecommendation(id)}
                      disabled={processingId === id}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <CheckCircle size={17} />
                      {processingId === id
                        ? 'Processing...'
                        : 'Approve Recommendation'}
                    </button>
                  )}

                  {status === 'Approved' && (
                    <button
                      onClick={() => applyRecommendation(id)}
                      disabled={processingId === id}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Play size={17} />
                      {processingId === id
                        ? 'Applying...'
                        : 'Apply Recommendation'}
                    </button>
                  )}

                  {status === 'Applied' && (
                    <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
                      <CheckCircle size={18} />
                      Recommendation successfully applied.
                    </p>
                  )}

                </div>
              )}

            </div>
          </section>
        );
      })}

    </div>
  );
}
