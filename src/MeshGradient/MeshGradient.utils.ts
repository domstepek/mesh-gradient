import { WebGPUErrors } from './MeshGradient.constants';
import { WebGPUErrorType } from './MeshGradient.types';

export class WebGPUInitError extends Error {
  type: WebGPUErrorType;

  constructor(type: WebGPUErrorType) {
    super(WebGPUErrors[type]);
    this.name = 'WebGPUInitError';
    this.type = type;
  }
}
