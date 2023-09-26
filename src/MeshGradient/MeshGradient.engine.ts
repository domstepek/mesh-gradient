// Shader
import shader from "./MeshGradient.shader.wgsl?raw";

// Assets
import { PlaneMesh } from "./MeshGradient.mesh";

// Utilities
import { WebGPUInitError } from "./MeshGradient.utils";

// Constants
import { AnimationSpeed } from "./MeshGradient.constants";

class MeshGradientEngine {
  canvas: HTMLCanvasElement;
  status: "running" | "stopped" = "stopped";

  // #region WebGPU Objects
  adapter: GPUAdapter | undefined;
  device: GPUDevice | undefined;
  context: GPUCanvasContext | undefined;
  format: GPUTextureFormat | undefined;
  // #endregion

  // #region Pipeline Objects
  timeBuffer: GPUBuffer | undefined;
  bindGroup: GPUBindGroup | undefined;
  pipeline: GPURenderPipeline | undefined;
  // #endregion

  // Assets
  planeMesh: PlaneMesh | undefined;

  // Binding Group 0
  time = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async init() {
    await this.setupDevice();
    this.createPipeline();
  }

  private async setupDevice() {
    if (!navigator.gpu) {
      throw new WebGPUInitError("gpu");
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      throw new WebGPUInitError("adapter");
    }

    this.adapter = adapter;

    const device = await adapter.requestDevice();
    this.device = device;

    const context = this.canvas.getContext("webgpu");

    if (!context) {
      throw new WebGPUInitError("context");
    }

    this.context = context;

    this.format = navigator.gpu.getPreferredCanvasFormat();

    this.createPlaneMesh();

    if (!this.context) {
      throw new WebGPUInitError("context");
    }

    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: "opaque",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
  }

  private createPipeline() {
    if (!this.device) {
      throw new Error("Device not initialized");
    }

    if (!this.planeMesh) {
      throw new Error("PlaneMesh not initialized");
    }

    const shaderModule = this.device.createShaderModule({
      code: shader,
    });

    this.timeBuffer = this.device.createBuffer({
      // 4 bytes per float and 1 floats
      size: 4 * 1,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    const bindingGroups = [[this.timeBuffer, GPUShaderStage.VERTEX]] as const;

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: bindingGroups.map((binding, i) => ({
        binding: i,
        visibility: binding[1],
        buffer: {},
      })),
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: bindingGroups.map((binding, i) => ({
        binding: i,
        resource: {
          buffer: binding[0],
        },
      })),
    });

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout],
    });

    this.pipeline = this.device.createRenderPipeline({
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
        buffers: [this.planeMesh.bufferLayout!],
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [
          {
            format: navigator.gpu.getPreferredCanvasFormat(),
          },
        ],
      },
      primitive: {
        topology: "triangle-strip",
      },
      layout: pipelineLayout,
    });
  }

  private createPlaneMesh() {
    if (!this.device) {
      throw new Error("Device not initialized");
    }

    const planeMesh = new PlaneMesh(
      this.device,
      this.canvas.width,
      this.canvas.height,
      1,
      1
    );
    this.planeMesh = planeMesh;
  }

  private updateTime() {
    if (!this.device) {
      throw new Error("Device not initialized");
    }

    if (!this.timeBuffer) {
      throw new Error("TimeBuffer not initialized");
    }

    this.time += AnimationSpeed;
    const timeArray = new Float32Array([this.time]);

    this.device.queue.writeBuffer(this.timeBuffer, 0, timeArray);
  }

  start() {
    this.status = "running";
    this.render();
  }

  stop() {
    this.status = "stopped";
  }

  private render() {
    if (this.status === "stopped") {
      return;
    }

    if (!this.device) {
      throw new Error("Device not initialized");
    }

    if (!this.context) {
      throw new Error("Context not initialized");
    }

    if (!this.pipeline) {
      throw new Error("Pipeline not initialized");
    }

    if (!this.bindGroup) {
      throw new Error("BindGroup not initialized");
    }

    if (!this.timeBuffer) {
      throw new Error("TimeBuffer not initialized");
    }

    if (!this.planeMesh) {
      throw new Error("PlaneMesh not initialized");
    }

    this.updateTime();

    // command encoder: records draw commands for submission
    const commandEncoder: GPUCommandEncoder =
      this.device.createCommandEncoder();
    // texture view: image view to the color buffer in this case
    const textureView: GPUTextureView = this.context
      .getCurrentTexture()
      .createView();

    // renderpass: holds draw commands, allocated from command encoder
    const renderpass: GPURenderPassEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 255.0, g: 255.0, b: 255.0, a: 255.0 },
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    });

    renderpass.setPipeline(this.pipeline);
    renderpass.setVertexBuffer(0, this.planeMesh.buffer!);
    renderpass.setBindGroup(0, this.bindGroup);
    renderpass.draw(this.planeMesh.verticies!.length / 2, 1, 0, 0);

    renderpass.end();

    this.device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(() => this.render.bind(this)());
  }
}

export default MeshGradientEngine;
