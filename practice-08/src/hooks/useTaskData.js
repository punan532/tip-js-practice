import { useEffect, useRef, useState } from 'react';

export function useTaskData({ api, filters }) {
  const [snapshot, setSnapshot] = useState({ tasks: [], categories: [], meta: { total: 0 } });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [mutationError, setMutationError] = useState(null);
  const [pending, setPending] = useState(false);
  const [revision, setRevision] = useState(0);
  const mutation = useRef(null);
  const mounted = useRef(false);
  const { q, completed, priority, categoryId } = filters;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      mutation.current?.abort();
      mutation.current = null;
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    setStatus('loading');
    setError(null);

    async function load() {
      try {
        const data = await api.loadInitialData({ q, completed, priority, categoryId }, { signal });
        if (signal.aborted) return;
        setSnapshot(data);
        setStatus('ready');
      } catch (error) {
        if (signal.aborted || error.kind === 'aborted') return;
        setError(error);
        setStatus('error');
      }
    }

    load();
    return () => controller.abort();
  }, [api, q, completed, priority, categoryId, revision]);

  function refresh() {
    setRevision(current => current + 1);
  }

  async function mutate(action) {
    if (!mounted.current || mutation.current) return false;
    const controller = new AbortController();
    mutation.current = controller;
    const { signal } = controller;
    setPending(true);
    setMutationError(null);
    try {
      await action({ signal });
      if (signal.aborted) return false;
      refresh();
      return true;
    } catch (error) {
      if (!signal.aborted) setMutationError(error);
      return false;
    } finally {
      if (mutation.current === controller) {
        mutation.current = null;
        setPending(false);
      }
    }
  }

  return {
    snapshot, status, error, mutationError, pending, refresh,
    saveTask: (id, value) => mutate(options => id === null
      ? api.createTask(value, options)
      : api.updateTask(id, value, options)),
    toggleTask: task => mutate(options => api.setTaskCompleted(task.id, !task.completed, options)),
    deleteTask: id => mutate(options => api.deleteTask(id, options)),
    resetData: () => mutate(options => api.resetDemoData(options)),
  };
}
