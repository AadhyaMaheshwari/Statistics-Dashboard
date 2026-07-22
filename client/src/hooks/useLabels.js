import { useState, useCallback } from 'react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/labels`;

export function useLabels() {
  const [labels,      setLabels]      = useState([]);
  const [scanResults, setScanResults] = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const setup = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.post(`${API}/setup`, {}, getAuthHeader());
      return data;
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }, []);

  const scan = useCallback(async (maxEmails = 500) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${API}/scan`, {
        params: { maxEmails },
        ...getAuthHeader(),
      });
      setScanResults(data.results);
      return data;
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }, []);
  
const fetchLabels = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get(`${API}/list`, getAuthHeader());
      setLabels(data.labels);
      return data.labels;
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }, []);

  const apply = useCallback(async (results) => {
    setLoading(true); setError(null);
    try {
      const { data } = await axios.post(`${API}/apply`, { results }, getAuthHeader());
      await fetchLabels();
      return data;
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
 }, [fetchLabels]);

  const deleteLabel = useCallback(async ({ key, results, action }) => {
  setLoading(true); setError(null);
  try {
    const { data } = await axios.post(
      `${API}/apply`,   // ✅ USE APPLY ROUTE
      { results, action },
      getAuthHeader()
    );

    await fetchLabels();
    return data;
  } catch (e) {
    setError(e.response?.data?.error || e.message);
  } finally {
    setLoading(false);
  }
}, [fetchLabels]);

  return { labels, scanResults, loading, error, setup, scan, apply, deleteLabel, fetchLabels };
}