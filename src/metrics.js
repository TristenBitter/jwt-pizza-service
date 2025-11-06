import { metrics as config } from "./config.js";
import os from "os";

class Metrics {
  constructor() {
    // HTTP request counters
    this.totalRequests = 0;
    this.getRequests = 0;
    this.postRequests = 0;
    this.putRequests = 0;
    this.deleteRequests = 0;

    // Authentication counters
    this.authAttempts = { success: 0, failure: 0 };
    this.activeUsers = 0;

    // Pizza metrics
    this.pizzaMetrics = {
      sold: 0,
      failures: 0,
      revenue: 0,
    };

    // Latency tracking
    this.pizzaLatency = [];
    this.serviceLatency = [];

    // Start sending metrics every 10 seconds
    this.sendMetricsPeriodically(10000);
  }

  // Middleware to track all HTTP requests
  requestTracker = (req, res, next) => {
    const startTime = Date.now();

    // Count the request by method
    this.totalRequests++;
    const method = req.method;
    if (method === "GET") this.getRequests++;
    else if (method === "POST") this.postRequests++;
    else if (method === "PUT") this.putRequests++;
    else if (method === "DELETE") this.deleteRequests++;

    // Track latency when response finishes
    res.on("finish", () => {
      const latency = Date.now() - startTime;
      this.serviceLatency.push(latency);
    });

    next();
  };

  // Call this when someone logs in
  authAttempt(success) {
    if (success) {
      this.authAttempts.success++;
      this.activeUsers++;
    } else {
      this.authAttempts.failure++;
    }
  }

  // Call this when someone logs out
  logout() {
    if (this.activeUsers > 0) {
      this.activeUsers--;
    }
  }

  // Call this when a pizza is purchased
  pizzaPurchase(success, latency, price) {
    if (success) {
      this.pizzaMetrics.sold++;
      this.pizzaMetrics.revenue += price;
    } else {
      this.pizzaMetrics.failures++;
    }
    this.pizzaLatency.push(latency);
  }

  // Get CPU usage percentage
  getCpuUsagePercentage() {
    const cpuUsage = os.loadavg()[0] / os.cpus().length;
    return parseFloat((cpuUsage * 100).toFixed(2));
  }

  // Get memory usage percentage
  getMemoryUsagePercentage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsage = (usedMemory / totalMemory) * 100;
    return parseFloat(memoryUsage.toFixed(2));
  }

  // Calculate average latency
  getAverageLatency(latencyArray) {
    if (latencyArray.length === 0) return 0;
    const sum = latencyArray.reduce((a, b) => a + b, 0);
    return sum / latencyArray.length;
  }

  // This runs every 10 seconds to send all metrics
  sendMetricsPeriodically(period) {
    setInterval(() => {
      try {
        // HTTP request metrics
        this.sendMetricToGrafana(
          "http_requests_total",
          this.totalRequests,
          "counter"
        );
        this.sendMetricToGrafana(
          "http_requests_get",
          this.getRequests,
          "counter"
        );
        this.sendMetricToGrafana(
          "http_requests_post",
          this.postRequests,
          "counter"
        );
        this.sendMetricToGrafana(
          "http_requests_put",
          this.putRequests,
          "counter"
        );
        this.sendMetricToGrafana(
          "http_requests_delete",
          this.deleteRequests,
          "counter"
        );

        // Authentication metrics
        this.sendMetricToGrafana(
          "auth_success",
          this.authAttempts.success,
          "counter"
        );
        this.sendMetricToGrafana(
          "auth_failure",
          this.authAttempts.failure,
          "counter"
        );
        this.sendMetricToGrafana("active_users", this.activeUsers, "gauge");

        // Pizza metrics
        this.sendMetricToGrafana(
          "pizza_sold",
          this.pizzaMetrics.sold,
          "counter"
        );
        this.sendMetricToGrafana(
          "pizza_failures",
          this.pizzaMetrics.failures,
          "counter"
        );
        this.sendMetricToGrafana(
          "pizza_revenue",
          this.pizzaMetrics.revenue,
          "counter"
        );

        // Latency metrics
        const avgPizzaLatency = this.getAverageLatency(this.pizzaLatency);
        const avgServiceLatency = this.getAverageLatency(this.serviceLatency);

        if (avgPizzaLatency > 0) {
          this.sendMetricToGrafana(
            "pizza_latency",
            Math.round(avgPizzaLatency),
            "gauge",
            "ms"
          );
        }
        if (avgServiceLatency > 0) {
          this.sendMetricToGrafana(
            "service_latency",
            Math.round(avgServiceLatency),
            "gauge",
            "ms"
          );
        }

        // System metrics
        this.sendMetricToGrafana(
          "cpu_usage",
          this.getCpuUsagePercentage(),
          "gauge",
          "%"
        );
        this.sendMetricToGrafana(
          "memory_usage",
          this.getMemoryUsagePercentage(),
          "gauge",
          "%"
        );

        // Clear latency arrays after sending
        this.pizzaLatency = [];
        this.serviceLatency = [];
      } catch (error) {
        console.error("Error sending metrics:", error);
      }
    }, period);
  }

  // Send a single metric to Grafana
  sendMetricToGrafana(metricName, metricValue, type, unit = "1") {
    const metricType = type === "counter" ? "sum" : "gauge";

    const metric = {
      resourceMetrics: [
        {
          scopeMetrics: [
            {
              metrics: [
                {
                  name: metricName,
                  unit: unit,
                  [metricType]: {
                    dataPoints: [
                      {
                        asInt: metricValue,
                        timeUnixNano: Date.now() * 1000000,
                        attributes: [
                          {
                            key: "source",
                            value: { stringValue: config.source },
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    };

    if (metricType === "sum") {
      metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
        metricType
      ].aggregationTemporality = "AGGREGATION_TEMPORALITY_CUMULATIVE";
      metric.resourceMetrics[0].scopeMetrics[0].metrics[0][
        metricType
      ].isMonotonic = true;
    }

    const body = JSON.stringify(metric);

    fetch(`${config.url}`, {
      method: "POST",
      body: body,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    })
      .then((response) => {
        if (!response.ok) {
          response.text().then((text) => {
            console.error(`Failed to push ${metricName} to Grafana: ${text}`);
          });
        } else {
          console.log(`✓ Pushed ${metricName}: ${metricValue}`);
        }
      })
      .catch((error) => {
        console.error(`Error pushing ${metricName}:`, error);
      });
  }
}

// Create a single instance and export it
const metrics = new Metrics();
export default metrics;
