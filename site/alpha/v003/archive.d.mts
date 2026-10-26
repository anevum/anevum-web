/** Browser-safe declarations for the canonical package archive validator. */
export type ZipEntry={path:string;mime:string|null;packed:number;unpacked:number;method:number;crc:number;dataAt:number;dataEnd:number};
export type ZipInspection={entries:ZipEntry[];expandedBytes:number;archiveBytes:number;entrypoint:'index.html'};
export declare const ZIP_LIMITS:Readonly<{archive:number;inflated:number;singleFile:number;files:number;path:number;ratio:number}>;
export declare function inspectZip(data:Uint8Array|ArrayBuffer):ZipInspection;
export declare class PackageError extends Error {status:number}
export declare function safeAssetPath(path:string):boolean;
