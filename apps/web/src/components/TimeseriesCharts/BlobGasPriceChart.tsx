import { createMaxAvgMinChart } from "./factories";

export const BlobGasPriceChart = createMaxAvgMinChart({
  description:
    "The highest, average, and lowest price per unit of blob gas in each period.",
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
