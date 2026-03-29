import { useState, useRef, useCallback } from "react";
import { api } from "../api/client";

export function useTraining(onComplete) {
  const [jobId, setJobId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const startTraining = useCallback(
    async (params) => {
      setIsTraining(true);
      setProgress(0);
      setError(null);

      try {
        const { job_id } = await api.startTraining(params);
        setJobId(job_id);

        intervalRef.current = setInterval(async () => {
          try {
            const status = await api.getJobStatus(job_id);
            setProgress(status.progress);

            if (status.status === "complete") {
              clearInterval(intervalRef.current);
              setIsTraining(false);
              onComplete?.();
            } else if (status.status === "failed") {
              clearInterval(intervalRef.current);
              setIsTraining(false);
              setError(status.error);
            }
          } catch (e) {
            clearInterval(intervalRef.current);
            setIsTraining(false);
            setError(e.message);
          }
        }, 2000);
      } catch (e) {
        setIsTraining(false);
        setError(e.message);
      }
    },
    [onComplete]
  );

  return { startTraining, isTraining, progress, error, jobId };
}
