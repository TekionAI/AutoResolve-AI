
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import Loading from '../components/common/Loading';
import StatusBadge from '../components/common/StatusBadge';
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  RefreshCw,
  X,
  Building2,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';

const extractArray = (response) => {
  const result = response?.data;

  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;

  return [];
};

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'Service Advisor',
  dealership: ''
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [dealerships, setDealerships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [form, setForm] = useState(initialForm);

  const loadData = async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const [usersRes, dealershipsRes] = await Promise.all([
        api.get('/auth/users'),
        api.get('/dealerships')
      ]);

      setUsers(extractArray(usersRes));
      setDealerships(extractArray(dealershipsRes));
    } catch (error) {
      console.error('User loading error:', error);

      toast.error(
        error.response?.data?.message ||
        'Unable to load user management data'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();

    return users.filter(user => {
      const dealershipName =
        typeof user.dealership === 'object'
          ? user.dealership?.name
          : '';

      const matchesSearch = [
        user.name,
        user.email,
        user.role,
        dealershipName
      ].some(value =>
        String(value || '').toLowerCase().includes(term)
      );

      const matchesRole =
        roleFilter === 'All' || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const managers = users.filter(
    user => user.role === 'Manager'
  ).length;

  const advisors = users.filter(
    user => user.role === 'Service Advisor'
  ).length;

  const technicians = users.filter(
    user => user.role === 'Technician'
  ).length;

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm(previous => ({
      ...previous,
      [name]: value
    }));
  };

  const handleCreate = async (event) => {
    event.preventDefault();

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.password ||
      !form.dealership
    ) {
      toast.error('Please complete all fields.');
      return;
    }

    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      setSaving(true);

      await api.post('/auth/users', {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase()
      });

      toast.success('User created successfully.');

      setForm(initialForm);
      setShowForm(false);

      await loadData(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to create user.'
      );
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      header: 'User',
      accessor: 'name',
      render: user => (
        <div className="min-w-[170px]">
          <p className="font-semibold text-white">
            {user.name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {user.email}
          </p>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: user => (
        <span className="rounded-md bg-dark-700 px-3 py-1 text-xs font-medium text-blue-300">
          {user.role}
        </span>
      )
    },
    {
      header: 'Dealership',
      accessor: 'dealership',
      render: user => (
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Building2 size={15} className="text-slate-400" />
          {typeof user.dealership === 'object'
            ? user.dealership?.name || '-'
            : dealerships.find(
                d => String(d._id) === String(user.dealership)
              )?.name || '-'}
        </div>
      )
    },
    {
      header: 'Account Status',
      accessor: 'isActive',
      render: user => (
        <StatusBadge
          status={user.isActive ? 'Active' : 'Inactive'}
        />
      )
    },
    {
      header: 'Created',
      accessor: 'createdAt',
      render: user => (
        <span className="text-sm text-slate-400">
          {user.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-IN')
            : '-'}
        </span>
      )
    }
  ];

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            User Management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage platform users, roles and dealership assignments
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-white hover:bg-dark-700"
          >
            <RefreshCw
              size={16}
              className={refreshing ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            <UserPlus size={17} />
            Add User
          </button>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Total Users</p>
            <UsersIcon size={22} className="text-blue-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {users.length}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Managers</p>
            <ShieldCheck size={22} className="text-purple-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {managers}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Service Advisors</p>
            <UsersIcon size={22} className="text-emerald-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {advisors}
          </p>
        </div>

        <div className="rounded-xl border border-dark-700 bg-dark-800 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Technicians</p>
            <UsersIcon size={22} className="text-amber-400" />
          </div>
          <p className="mt-3 text-3xl font-bold text-white">
            {technicians}
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
            placeholder="Search name, email or dealership..."
            className="w-full rounded-lg border border-dark-700 bg-dark-800 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="rounded-lg border border-dark-700 bg-dark-800 px-4 py-2 text-sm text-white outline-none"
        >
          <option value="All">All Roles</option>
          <option value="Manager">Manager</option>
          <option value="Service Advisor">Service Advisor</option>
          <option value="Technician">Technician</option>
        </select>
      </div>

      {/* USERS TABLE */}
      <div className="rounded-xl border border-dark-700 bg-dark-800 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">
            Registered Users
          </h2>
          <span className="text-xs text-slate-400">
            {filteredUsers.length} users
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredUsers}
          loading={loading}
          emptyMessage="No users found."
        />
      </div>

      {/* CREATE USER MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4">
          <div className="my-auto w-full max-w-xl rounded-xl border border-dark-700 bg-dark-800 p-6 shadow-2xl">

            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Create New User
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Add a user to the service operations platform
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-dark-700 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Full Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="user@example.com"
                  required
                  className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Temporary Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                  className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  User Role
                </label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="Service Advisor">Service Advisor</option>
                  <option value="Technician">Technician</option>
                  <option value="Manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">
                  Dealership
                </label>
                <select
                  name="dealership"
                  value={form.dealership}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-dark-700 bg-dark-900 px-3 py-2.5 text-white outline-none focus:border-blue-500"
                >
                  <option value="">Select Dealership</option>
                  {dealerships.map(dealership => (
                    <option
                      key={dealership._id}
                      value={dealership._id}
                    >
                      {dealership.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-dark-700 pt-5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-dark-600 px-4 py-2 text-sm text-slate-300 hover:bg-dark-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
