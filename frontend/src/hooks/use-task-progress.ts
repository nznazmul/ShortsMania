"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TaskProgress } from "../lib/types";
import { getTask } from "../lib/api";

export function useTaskProgress(taskId: string | null, onCompleted?: (task: TaskProgress) => void) {
  const [task, setTask] = useState<TaskProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDirectly = useCallback(async () => {
    if (!taskId) return;
    try {
      const data = await getTask(taskId);
      setTask(data);
      if (data.status === "completed") {
        if (onCompleted) onCompleted(data);
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch task");
    }
  }, [taskId, onCompleted]);

  useEffect(() => {
    if (!taskId) {
      setTask(null);
      return;
    }

    let isMounted = true;
    const wsUrl = `ws://127.0.0.1:8000/api/v1/tasks/${taskId}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isMounted) setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data: TaskProgress = JSON.parse(event.data);
          if (isMounted) {
            setTask(data);
            if (data.status === "completed" && onCompleted) {
              onCompleted(data);
            }
          }
        } catch {
          // pong or raw string
        }
      };

      ws.onerror = () => {
        if (isMounted) {
          setIsConnected(false);
          // Fallback to polling
          if (!pollIntervalRef.current) {
            pollIntervalRef.current = setInterval(fetchDirectly, 1000);
          }
        }
      };

      ws.onclose = () => {
        if (isMounted) setIsConnected(false);
      };
    } catch (e) {
      // Immediate polling fallback
      fetchDirectly();
      pollIntervalRef.current = setInterval(fetchDirectly, 1000);
    }

    // Initial fetch
    fetchDirectly();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [taskId, fetchDirectly, onCompleted]);

  return { task, isConnected, error, refresh: fetchDirectly };
}
