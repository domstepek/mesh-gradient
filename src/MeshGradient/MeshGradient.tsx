import { FC, useEffect, useRef, useState } from "react";

// Engine
import MeshGradientEngine from "./MeshGradient.engine";

// Utilities
import { WebGPUInitError } from "./MeshGradient.utils";

// Types
import { WebGPUErrorType } from "./MeshGradient.types";

interface Props {
  fallback?: React.ReactNode;
  canvasStyles?: React.CSSProperties;
}

const MeshGradient: FC<Props> = ({ fallback, canvasStyles }) => {
  const [canvasRef, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [gpuSupport, setGPUSupport] = useState<{
    supported: boolean;
    error: WebGPUErrorType | null;
  }>({
    supported: false,
    error: null,
  });

  const meshGradientEngine = useRef<MeshGradientEngine | null>(null);

  useEffect(() => {
    const initializeWebGPU = async () => {
      if (!canvasRef) return;

      const engine = new MeshGradientEngine(canvasRef);

      try {
        await engine.init();

        setGPUSupport({
          supported: true,
          error: null,
        });
      } catch (error) {
        if (error instanceof WebGPUInitError) {
          setGPUSupport({
            supported: false,
            error: error.type,
          });
        }

        return;
      }

      engine.start();

      meshGradientEngine.current = engine;
    };

    initializeWebGPU();

    return () => {
      if (meshGradientEngine.current?.device) {
        meshGradientEngine.current.device.destroy();
      }
    };
  }, [canvasRef]);

  if (!gpuSupport.supported && gpuSupport.error) {
    return <>fallback</> ?? <div>{gpuSupport.error}</div>;
  }

  return <canvas id="mesh-gradient" ref={setCanvas} style={canvasStyles} />;
};

export default MeshGradient;
