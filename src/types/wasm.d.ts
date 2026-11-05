// Wrangler bundles `.wasm` imports into compiled WebAssembly modules. TypeScript needs telling.
declare module "*.wasm" {
  const module: WebAssembly.Module;
  export default module;
}
