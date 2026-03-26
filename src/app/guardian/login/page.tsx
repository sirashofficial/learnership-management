'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function GuardianLoginPage() {
  const router = useRouter();
  const { login, user, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  // Redirect if already logged in as guardian
  useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'GUARDIAN') {
        router.push('/guardian/dashboard');
      } else {
        // Logged in as different role, redirect to appropriate portal
        router.push('/');
      }
    }
  }, [user, isLoading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (isSubmittingRef.current || loading) {
      console.log('Login already in progress, ignoring duplicate submission');
      return;
    }

    isSubmittingRef.current = true;
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login failed. Please check your credentials.');
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      const { user: userData, token } = data.data;

      // Verify user is a guardian
      if (userData.role !== 'GUARDIAN') {
        setError('This portal is for guardians only. Please use your regular login.');
        isSubmittingRef.current = false;
        setLoading(false);
        return;
      }

      // Save auth data and redirect
      login(token, userData);
      router.push('/guardian/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login. Please try again.');
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              Parent/Guardian Portal
            </h1>
            <p className="text-sm text-gray-600 text-center mt-2">
              Monitor your student's progress and attendance
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                disabled={loading}
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                Remember me for 30 days
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 mt-6"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="mt-6 border-t border-gray-200"></div>

          {/* Links */}
          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Register here
              </Link>
            </p>
            <p className="text-gray-600 mt-3">
              Are you a student or facilitator?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Use main login
              </Link>
            </p>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-md border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">About This Portal</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ View your linked student's progress</li>
              <li>✓ Check attendance and monthly rates</li>
              <li>✓ Review grades and assessments</li>
              <li>✓ Track upcoming assessments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
