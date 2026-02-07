import { LineChart, BarChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  ToolboxComponent,
  GridComponent,
  LegendComponent,
  GraphicComponent,
  DatasetComponent,
  DataZoomComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";

// Register only needed components
echarts.use([
  BarChart,
  CanvasRenderer,
  DatasetComponent,
  DataZoomComponent,
  GraphicComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
]);

export default echarts;
