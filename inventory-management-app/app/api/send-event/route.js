// app/api/send-event/route.js
import { EventHubProducerClient } from '@azure/event-hubs';

const connectionString = process.env.AZURE_EVENT_HUB_CONNECTION_STRING; // Add to your .env
const eventHubName = process.env.AZURE_EVENT_HUB_NAME;

export async function POST(req) {
    const producer = new EventHubProducerClient(connectionString, eventHubName);

    try {
        const eventData = await req.json();
        const batch = await producer.createBatch();
        batch.tryAdd({ body: eventData });

        await producer.sendBatch(batch);
        await producer.close();

        return new Response('Event sent successfully', { status: 200 });
    } catch (error) {
        console.error('Error sending event:', error);
        return new Response('Failed to send event', { status: 500 });
    }
}
