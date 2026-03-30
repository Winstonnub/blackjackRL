import { useState, useEffect, useCallback } from "react";
import { api } from "../../api/client";
import ModelSelector from "./ModelSelector";
import BenchmarkCards from "./BenchmarkCards";
import LearningCurveChart from "./LearningCurveChart";
import TrainPanel from "../Train/TrainPanel";

const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";

export default function Dashboard() {
  const [models, setModels] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);

  const refreshModels = useCallback(async () => {
    const list = await api.listModels();
    setModels(list);
  }, []);

  useEffect(() => {
    refreshModels();
  }, [refreshModels]);

  useEffect(() => {
    if (!selectedId) {
      setBenchmarkData(null);
      return;
    }
    api.getBenchmarks(selectedId).then(setBenchmarkData);
  }, [selectedId]);

  return (
    <div className="dashboard">
      {!STATIC_MODE && <TrainPanel onModelTrained={refreshModels} />}
      {!STATIC_MODE && <hr />}

      <h2>Model Benchmarks</h2>
      <ModelSelector
        models={models}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      {benchmarkData && (
        <>
          <BenchmarkCards benchmarks={benchmarkData.benchmarks} />
          <LearningCurveChart learningCurve={benchmarkData.learning_curve} />

          <div className="model-meta">
            <p>
              <strong>Algorithm:</strong> {benchmarkData.algorithm} |{" "}
              <strong>Episodes:</strong>{" "}
              {benchmarkData.episodes?.toLocaleString()} |{" "}
              <strong>Trained:</strong>{" "}
              {new Date(benchmarkData.trained_at).toLocaleString()}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
