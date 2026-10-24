declare module 'meshoptimizer/meshopt_decoder_reference.js' {
 export const MeshoptDecoder: Omit<typeof import('meshoptimizer').MeshoptDecoder,'decodeGltfBufferAsync'|'useWorkers'>;
}
