
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
    <div className="space-y-7">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30 text-blue-400">
            <BrainCircuit size={32} />
          </div>

          <div>
            <p className="text-blue-400 text-sm font-medium">
              INTELLIGENT OPERATIONS
            </p>

            <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">
              AI Decision Centre
            </h1>

            <p className="text-slate-400 text-sm mt-1">
              Identify sourcing options and resolve parts shortages.
            </p>
          </div>
        </div>

        <button
          onClick={fetchRepairOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-dark-700 hover:bg-dark-600 text-white"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Blocked Repair Orders */}
      <section className="bg-dark-800 border border-dark-700 rounded-xl p-6">

        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="text-red-400" size={20} />

          <h2 className="text-lg font-semibold text-white">
            Blocked Repair Orders
          </h2>
        </div>

        <p className="text-slate-400 text-sm mb-5">
          Select a repair order waiting for parts to generate sourcing recommendations.
        </p>

        {repairOrders.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No blocked repair orders found.
          </p>
        ) : (
          <form
            onSubmit={generateRecommendations}
            className="flex flex-col md:flex-row gap-4"
          >
            <select
              value={selectedRO}
              onChange={e => setSelectedRO(e.target.value)}
              className="flex-1 bg-dark-900 border border-dark-600 rounded-xl px-4 py-3 text-white"
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
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold"
            >
              <Search size={18} />
              {generating ? 'Generating...' : 'Generate Solution'}
            </button>
          </form>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
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
            className="bg-dark-800 border border-dark-700 rounded-xl overflow-hidden"
          >

            {/* Recommendation Header */}
            <div className="p-5 border-b border-dark-700 flex flex-wrap justify-between gap-3">

              <div className="flex items-center gap-2">
                <BrainCircuit className="text-blue-400" size={20} />

                <h2 className="text-lg font-semibold text-white">
                  Sourcing Recommendation {index + 1}
                </h2>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs ${
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

            <div className="p-5 space-y-6">

              {/* AI Explanation */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="text-blue-400" size={19} />

                  <h3 className="font-semibold text-white">
                    AI Recommended Decision
                  </h3>
                </div>

                <p className="text-sm text-slate-300">
                  {rec.explanation || 'No explanation available.'}
                </p>

                {bestSource && (
                  <p className="text-sm text-blue-400 font-medium mt-3">
                    Highest-ranked source: {bestSource.sourceName}
                    {' '}({bestSource.score} points)
                  </p>
                )}
              </div>

              {/* Sourcing Options */}
              <div>
                <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                  <h3 className="text-white font-semibold text-lg">
                    Alternative Sourcing Options
                  </h3>

                  <span className="text-xs text-slate-400">
                    {sourcingOptions.length} eligible options evaluated
                  </span>
                </div>

                {sourcingOptions.length === 0 ? (
                  <p className="text-slate-400 text-sm">
                    No sourcing options available.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-slate-400 bg-dark-900">
                        <tr>
                          <th className="p-3">Source</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Stock</th>
                          <th className="p-3">Total Cost</th>
                          <th className="p-3">Delivery</th>
                          <th className="p-3">Reliability</th>
                          <th className="p-3">Score</th>
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
                                className={`border-b border-dark-700 ${
                                  isBest ? 'bg-blue-500/5' : ''
                                }`}
                              >
                                <td className="p-3">
                                  <div className="font-medium text-white">
                                    {option.sourceName}
                                  </div>

                                  <div className="text-xs text-slate-500 mt-1">
                                    {option.location}
                                  </div>

                                  {isBest && (
                                    <span className="inline-block mt-2 text-xs text-emerald-400">
                                      Recommended
                                    </span>
                                  )}
                                </td>

                                <td className="p-3 text-slate-300">
                                  {option.sourceType}
                                </td>

                                <td className="p-3 text-slate-300">
                                  {option.availableQuantity} units
                                </td>

                                <td className="p-3 text-white font-medium">
                                  ₹{(
                                    option.unitPrice * option.quantity
                                  ).toLocaleString('en-IN')}
                                </td>

                                <td className="p-3 text-slate-300">
                                  <span className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {option.estimatedDeliveryHours} hrs
                                  </span>
                                </td>

                                <td className="p-3 text-slate-300">
                                  <span className="flex items-center gap-1">
                                    <ShieldCheck size={14} />
                                    {option.reliabilityScore}%
                                  </span>
                                </td>

                                <td className="p-3 font-semibold text-blue-400">
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div className="bg-dark-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                    <Package size={16} />
                    Required Quantity
                  </div>

                  <p className="text-xl font-bold text-white">
                    {rec.shortageDetails?.requiredQuantity ?? 0}
                  </p>
                </div>

                <div className="bg-dark-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                    <Truck size={16} />
                    Recommended Delivery
                  </div>

                  <p className="text-xl font-bold text-white">
                    {rec.proposedSource?.estimatedDeliveryHours ?? 0} hrs
                  </p>
                </div>

                <div className="bg-dark-900 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                    <IndianRupee size={16} />
                    Recommended Total Cost
                  </div>

                  <p className="text-xl font-bold text-white">
                    ₹{Number(
                      rec.proposedSource?.estimatedCost ?? 0
                    ).toLocaleString('en-IN')}
                  </p>
                </div>

              </div>

              {/* Manager Actions */}
              {id && (
                <div className="flex flex-wrap gap-3 pt-2">

                  {status !== 'Approved' && status !== 'Applied' && (
                    <button
                      onClick={() => approveRecommendation(id)}
                      disabled={processingId === id}
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg font-semibold"
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
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg font-semibold"
                    >
                      <Play size={17} />

                      {processingId === id
                        ? 'Applying...'
                        : 'Apply Recommendation'}
                    </button>
                  )}

                  {status === 'Applied' && (
                    <p className="text-emerald-400 text-sm flex items-center gap-2">
                      <CheckCircle size={17} />
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
