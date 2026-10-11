'use strict';
// DOMMatrix 最小 polyfill（Electron 主进程专用）
// pdf-parse@2.4.5 内嵌的 pdf.js 在模块顶层即执行 `new DOMMatrix`，
// 而 Electron 主进程是纯 Node 环境，没有浏览器 DOMMatrix 全局对象，
// 且其首选 polyfill 源 @napi-rs/canvas 未被打入 Windows 安装包，
// 导致应用启动即抛 "ReferenceError: DOMMatrix is not defined"。
// 本文件在 require('pdf-parse') 之前注入标准矩阵运算实现以规避。
class DOMMatrixPolyfill {
  constructor(init) {
    this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    if (init === undefined || init === null) return;
    if (Array.isArray(init) || ArrayBuffer.isView(init)) {
      const v = Array.from(init);
      if (v.length >= 6) {
        this.a = +v[0]; this.b = +v[1]; this.c = +v[2];
        this.d = +v[3]; this.e = +v[4]; this.f = +v[5];
      }
    } else if (typeof init === 'object') {
      const m = ('m11' in init)
        ? { a: init.m11, b: init.m12, c: init.m21, d: init.m22, e: init.m41, f: init.m42 }
        : init;
      this.a = m.a !== undefined ? +m.a : 1;
      this.b = m.b !== undefined ? +m.b : 0;
      this.c = m.c !== undefined ? +m.c : 0;
      this.d = m.d !== undefined ? +m.d : 1;
      this.e = m.e !== undefined ? +m.e : 0;
      this.f = m.f !== undefined ? +m.f : 0;
    }
  }
  get m11() { return this.a; } set m11(v) { this.a = v; }
  get m12() { return this.b; } set m12(v) { this.b = v; }
  get m21() { return this.c; } set m21(v) { this.c = v; }
  get m22() { return this.d; } set m22(v) { this.d = v; }
  get m41() { return this.e; } set m41(v) { this.e = v; }
  get m42() { return this.f; } set m42(v) { this.f = v; }
  get is2D() { return true; }
  get isIdentity() {
    return this.a === 1 && this.b === 0 && this.c === 0 &&
           this.d === 1 && this.e === 0 && this.f === 0;
  }
  multiply(m) {
    return new DOMMatrixPolyfill([
      this.a * m.a + this.c * m.b, this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d, this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e, this.b * m.e + this.d * m.f + this.f
    ]);
  }
  multiplySelf(m) {
    const r = this.multiply(m);
    this.a = r.a; this.b = r.b; this.c = r.c; this.d = r.d; this.e = r.e; this.f = r.f;
    return this;
  }
  preMultiplySelf(m) {
    const r = m.multiply(this);
    this.a = r.a; this.b = r.b; this.c = r.c; this.d = r.d; this.e = r.e; this.f = r.f;
    return this;
  }
  translate(tx, ty) {
    return new DOMMatrixPolyfill([
      this.a, this.b, this.c, this.d,
      this.e + this.a * tx + this.c * ty,
      this.f + this.b * tx + this.d * ty
    ]);
  }
  translateSelf(tx, ty) {
    const r = this.translate(tx, ty);
    this.a = r.a; this.b = r.b; this.c = r.c; this.d = r.d; this.e = r.e; this.f = r.f;
    return this;
  }
  scale(sx, sy = sx, sz = 0, ox = 0, oy = 0) {
    const tx = ox - sx * ox;
    const ty = oy - sy * oy;
    return new DOMMatrixPolyfill([
      this.a * sx, this.b * sx, this.c * sy, this.d * sy,
      this.e + this.a * tx + this.c * ty,
      this.f + this.b * tx + this.d * ty
    ]);
  }
  scaleSelf(sx, sy = sx, sz = 0, ox = 0, oy = 0) {
    const r = this.scale(sx, sy, sz, ox, oy);
    this.a = r.a; this.b = r.b; this.c = r.c; this.d = r.d; this.e = r.e; this.f = r.f;
    return this;
  }
  rotate(rot, rotY = 0, rotZ = 0) {
    if (rotY || rotZ) return this;
    const rad = rot * Math.PI / 180;
    const c = Math.cos(rad), s = Math.sin(rad);
    return new DOMMatrixPolyfill([
      this.a * c + this.c * s, this.b * c + this.d * s,
      this.c * c - this.a * s, this.d * c - this.b * s,
      this.e, this.f
    ]);
  }
  invertSelf() {
    const det = this.a * this.d - this.b * this.c;
    if (det === 0) {
      this.a = NaN; this.b = NaN; this.c = NaN; this.d = NaN; this.e = NaN; this.f = NaN;
      return this;
    }
    const a = this.d / det, b = -this.b / det, c = -this.c / det,
          d = this.a / det,
          e = (this.c * this.f - this.d * this.e) / det,
          f = (this.b * this.e - this.a * this.f) / det;
    this.a = a; this.b = b; this.c = c; this.d = d; this.e = e; this.f = f;
    return this;
  }
  transformPoint(p) {
    return {
      x: this.a * p.x + this.c * p.y + this.e,
      y: this.b * p.x + this.d * p.y + this.f,
      z: 0, w: 1
    };
  }
  toString() {
    return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`;
  }
}
if (typeof globalThis.DOMMatrix === 'undefined') globalThis.DOMMatrix = DOMMatrixPolyfill;
// pdf-parse 顶层会检查 globalThis.ImageData（缺它仅警告"rendering may be broken"），
// 一并注入最小实现，避免未来渲染路径出现未定义崩溃。
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageDataPolyfill {
    constructor(dataOrWidth, heightOrWidth, height) {
      if (typeof dataOrWidth === 'number') {
        this.width = dataOrWidth;
        this.height = heightOrWidth;
        this.data = new Uint8ClampedArray(this.width * this.height * 4);
      } else {
        this.data = dataOrWidth;
        this.width = heightOrWidth;
        this.height = height;
      }
    }
  };
}
module.exports = DOMMatrixPolyfill;
