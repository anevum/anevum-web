/** Browser-safe declarations for the canonical package archive validator.
 * The default inspection is strict and release-compatible. Metadata-only
 * inspection is local diagnosis, never a publishing/admission decision.
 */
export type ZipEntry={path:string;mime:string|null;packed:number;unpacked:number;method:number;crc:number;dataAt:number;dataEnd:number};
export type ZipInspection={entries:ZipEntry[];expandedBytes:number;archiveBytes:number;entrypoint:'index.html'};
export type ZipMetadataInspection=Omit<ZipInspection,'entrypoint'>&{entrypoint:'index.html'|null};
export declare const ZIP_LIMITS:Readonly<{archive:number;inflated:number;singleFile:number;files:number;path:number;ratio:number}>;
export declare function inspectZip(data:Uint8Array|ArrayBuffer):ZipInspection;
export declare function inspectZip(data:Uint8Array|ArrayBuffer,options:{metadataOnly?:false}):ZipInspection;
export declare function inspectZip(data:Uint8Array|ArrayBuffer,options:{metadataOnly:true}):ZipMetadataInspection;
export declare class PackageError extends Error {status:number}
