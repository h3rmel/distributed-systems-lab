import { createWriteStream } from "node:fs";
import { randomUUID } from "node:crypto";
import path from 'node:path';

const ROW_COUNT = 5_000_000;
const OUTPUT_PATH = path.join(process.cwd(), 'mocks', 'large-test.csv');

const PROVIDERS = ['stripe', 'paypal', 'square', 'adyen', 'braintree'];

function generateRow(index: number): string {
  const provider = PROVIDERS[index % PROVIDERS.length];
  const eventId = `evt_${randomUUID()}`;
  const timestamp = new Date(Date.now() - index * 1000).toISOString();
  const data = JSON.stringify({ amount: (index % 10000) + 1, index });

  return `${provider},${eventId},${timestamp},${data}\n`;
}

async function generateCSV(): Promise<void> {
  console.log(`Generating ${ROW_COUNT.toLocaleString()} rows to ${OUTPUT_PATH}`);
  const startTime = Date.now();

  const stream = createWriteStream(OUTPUT_PATH);

  // CSV Header
  stream.write('provider,eventId,timestamp,data\n');

  for (let i = 0; i < ROW_COUNT; i++) {
    const row = generateRow(i);

    const canContinue = stream.write(row);

    if (!canContinue) {
      await new Promise<void>((resolve) => stream.once('drain', resolve));
    }

    // Log progress every 500,000 rows
    if (i > 0 && i % 500_000 === 0) {
      const percent = ((i / ROW_COUNT) * 100).toFixed(1);
      
      console.log(`Progress: ${percent}% (${i.toLocaleString()} rows)`);
    }
  }

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on('error', reject);
  })

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`Done! Generated ${ROW_COUNT.toLocaleString()} rows in ${elapsed} seconds`);
}

generateCSV().catch((error: unknown) => {
  console.error('Generation failed: ', error);
  process.exit(1);
})