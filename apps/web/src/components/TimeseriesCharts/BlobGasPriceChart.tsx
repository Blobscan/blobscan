import { createMaxAvgMinChart } from "./factories";

export const BlobGasPriceChart = createMaxAvgMinChart({
  title: "Blob Gas Price",
  label: "Blob Gas Price",
  metrics: {
    max: "maxBlobGasPrice",
    avg: "avgBlobGasPrice",
    min: "minBlobGasPrice",
  },
  yAxis: {
    type: "average",
    unitType: "ether",
    unit: "wei",
    displayUnit: "Gwei",
  },
  componentName: "BlobGasPriceChart",
});
