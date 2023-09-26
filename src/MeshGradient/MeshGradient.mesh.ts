/* eslint-disable lines-between-class-members */

export class PlaneMesh {
  buffer: GPUBuffer | undefined;
  bufferLayout: GPUVertexBufferLayout | undefined;
  verticies: Float32Array | undefined;

  constructor(
    private device: GPUDevice,
    width: number,
    height: number,
    xResolution: number,
    yResolution: number
  ) {
    this.generateSimpleVertices();
    // this.generateVertices(width, height, xResolution, yResolution);

    const usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;

    this.buffer = this.device.createBuffer({
      size: this.verticies!.byteLength,
      usage,
      mappedAtCreation: true,
    });

    new Float32Array(this.buffer.getMappedRange()).set(this.verticies!);
    this.buffer.unmap();

    this.bufferLayout = {
      // 4 bytes per float and 2 floats per vertex (x, y)
      arrayStride: 4 * 2,
      attributes: [
        {
          format: "float32x2",
          offset: 0,
          shaderLocation: 0,
        },
      ],
    } as GPUVertexBufferLayout;
  }

  generateSimpleVertices() {
    this.verticies = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  }

  /**
   * Creates a plane mesh with the given width, height, and resolution. The topology is a triangle strip.
   * @param width
   * @param height
   * @param resolution
   */
  generateVertices(
    width: number,
    height: number,
    xResolution: number,
    yResolution: number
  ) {
    const verticies = [];

    const xStep = width / xResolution;
    const yStep = height / yResolution;

    const w_2 = width / 2;
    const h_2 = height / 2;

    const normalizeCoord = (x: number, y: number) => {
      return [0.5 - (x + w_2) / width, 0.5 - (y + h_2) / height];
    };

    for (let x = -w_2; x < w_2; x += xStep) {
      for (let y = -h_2; y < h_2; y += yStep) {
        const x0 = x;
        const y0 = y;
        const x1 = x + xStep;
        const y1 = y + yStep;

        verticies.push(...normalizeCoord(x0, y0));
        verticies.push(...normalizeCoord(x1, y0));
        verticies.push(...normalizeCoord(x0, y1));
        verticies.push(...normalizeCoord(x1, y1));
      }
    }

    this.verticies = new Float32Array(verticies);
  }
}
