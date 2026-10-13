// Conservative staging pilot limits; formats require server-side signature and safety validation.
export type AssetKind="image"|"audio"|"document"|"package";
export const privateFormats={
  png:{kind:"image",mime:"image/png",max:10*1024*1024},
  jpg:{kind:"image",mime:"image/jpeg",max:10*1024*1024},
  jpeg:{kind:"image",mime:"image/jpeg",max:10*1024*1024},
  webp:{kind:"image",mime:"image/webp",max:10*1024*1024},
  gif:{kind:"image",mime:"image/gif",max:10*1024*1024},
  mp3:{kind:"audio",mime:"audio/mpeg",max:20*1024*1024},
  wav:{kind:"audio",mime:"audio/wav",max:20*1024*1024},
  pdf:{kind:"document",mime:"application/pdf",max:10*1024*1024},
  txt:{kind:"document",mime:"text/plain",max:1024*1024},
  md:{kind:"document",mime:"text/markdown",max:1024*1024},
  zip:{kind:"package",mime:"application/zip",max:20*1024*1024}
} as const;
export function classifyFile(file:Pick<File,"name"|"size"|"type">){
  const ext=file.name.split(".").at(-1)?.toLowerCase()||"";
  const rule=privateFormats[ext as keyof typeof privateFormats];
  if(!rule)return {ok:false as const,reason:"This format is not enabled in the private upload pilot."};
  if(!file.size||file.size>rule.max)return {ok:false as const,reason:"This file exceeds the current limit for "+ext.toUpperCase()+"."};
  if(file.name.length>160||/[\\/\u0000-\u001f\u007f]/.test(file.name)||file.name.startsWith("."))return {ok:false as const,reason:"Invalid file name."};
  if(file.type && file.type!==rule.mime && !(ext==="jpg"&&file.type==="image/jpeg") && !(ext==="md"&&file.type==="text/plain"))return {ok:false as const,reason:"The browser-reported file type does not match the extension."};
  return {ok:true as const,kind:rule.kind,contentType:rule.mime,extension:ext};
}
