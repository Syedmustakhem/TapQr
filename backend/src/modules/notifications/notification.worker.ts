import { NotificationDeliveryService } from "./notification.delivery.service";

const POLL_INTERVAL_MS = 10_000;
const BATCH_SIZE = 20;

let running = false;
let timer: NodeJS.Timeout | null = null;

const deliveryService = new NotificationDeliveryService();

export async function processNotificationDeliveries() {
  if (running) return;

  running = true;

  try {
    const result = await deliveryService.processBatch(BATCH_SIZE);

    if (result.processed > 0) {
      console.info("[NOTIFICATION][WORKER] Batch processed", result);
    }
  } catch (error) {
    console.error("[NOTIFICATION][WORKER] Batch failed", error);
  } finally {
    running = false;
  }
}

export function startNotificationWorker() {
  if (timer) return;

  console.info(
    `[NOTIFICATION][WORKER] Started (poll=${POLL_INTERVAL_MS}ms, batch=${BATCH_SIZE})`
  );

  void processNotificationDeliveries();

  timer = setInterval(() => {
    void processNotificationDeliveries();
  }, POLL_INTERVAL_MS);
}

export function stopNotificationWorker() {
  if (!timer) return;

  clearInterval(timer);
  timer = null;
  console.info("[NOTIFICATION][WORKER] Stopped");
}
