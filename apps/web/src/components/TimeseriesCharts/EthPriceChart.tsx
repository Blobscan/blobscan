import { createMaxAvgMinChart } from "./factories";

export const EthPriceChart = createMaxAvgMinChart({
  title: "ETH Price",
  label: "ETH Price",
  metrics: {
    max: "maxEthPrice",
    avg: "avgEthPrice",
    min: "minEthPrice",
  },
  yAxis: {
    type: "average",
    unitType: "fiat",
    unit: "USD",
  },
  componentName: "EthPriceChart",
});
