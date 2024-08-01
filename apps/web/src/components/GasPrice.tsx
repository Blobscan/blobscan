import { api } from "~/api-client";

export function LatestGasPrice() {
  const { data } = api.block.getLatestGasPrice.useQuery();

  if (!data) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 rounded px-3 py-1">
      <GasSVG />
      <div>
        <span className="font-bold">Blob gas price: </span>
        {data.blobGasPrice.toString()}
        <span className="test-sm opacity-80"> wei</span>
      </div>
    </div>
  );
}

function GasSVG() {
  return (
    <svg fill="currentColor" height="18px" width="18px" viewBox="0 0 512 512">
      <g>
        <path d="M494.313,99.375l-64-32c-15.844-7.93-35.047-1.469-42.938,14.313c-7.906,15.813-1.5,35.031,14.313,42.938L448,147.773V368   c0,8.82-7.172,16-16,16s-16-7.18-16-16V240c0-52.938-43.063-96-96-96V64c0-35.289-28.703-64-64-64H96C60.703,0,32,28.711,32,64   v354.742L9.375,441.375C3.375,447.375,0,455.516,0,464v16c0,17.672,14.328,32,32,32h288c17.672,0,32-14.328,32-32v-16   c0-8.484-3.375-16.625-9.375-22.625L320,418.742V208c17.641,0,32,14.352,32,32v128c0,44.109,35.891,80,80,80s80-35.891,80-80V128   C512,115.883,505.156,104.797,494.313,99.375z M272,223.997h-85.164l-27.977-69.942c-3.281-8.203-12.672-12.172-20.797-8.914   c-8.203,3.289-12.203,12.594-8.922,20.805l23.221,58.052H80v-160c0-8.837,7.163-16,16-16h160c8.837,0,16,7.163,16,16V223.997z" />
        <circle cx="176" cy="95.997" r="16" />
        <circle cx="240" cy="111.997" r="16" />
        <circle cx="112" cy="111.997" r="16" />
      </g>
    </svg>
  );
}
