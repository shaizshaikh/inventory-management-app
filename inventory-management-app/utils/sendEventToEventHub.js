// utils/sendEventToEventHub.js
export async function sendEventToEventHub(eventData) {
    try {
        const response = await fetch('/api/send-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(eventData),
        });
        if (!response.ok) {
            throw new Error('Failed to send event to Event Hub');
        }
    } catch (error) {
        console.error('Error sending event to Event Hub:', error);
    }
}
