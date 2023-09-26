/**
 * For animation constants, check the shader file
 * @see {@link file://./MeshGradient.shader.wgsl}
 */

import { WebGPUErrorType } from './MeshGradient.types';

export const WebGPUErrors: Record<WebGPUErrorType, string> = {
  gpu: 'WebGPU not supported, falling back to WebGL',
  adapter: 'Failed to find a suitable GPU adapter',
  context: 'Failed to create WebGPU context',
} as const;

export const AnimationSpeed = 0.001 as const;
