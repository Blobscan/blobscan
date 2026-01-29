import { LineChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  ToolboxComponent,
  GridComponent,
  LegendComponent,
  GraphicComponent,
  DatasetComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

import "echarts/lib/component/dataZoom";

// Register only needed components
echarts.use([
  BarChart,
  CanvasRenderer,
  DatasetComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
]);

export default echarts;
