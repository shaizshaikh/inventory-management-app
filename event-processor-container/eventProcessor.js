const { EventHubConsumerClient } = require('@azure/event-hubs');
const { BlobServiceClient } = require('@azure/storage-blob');
const { TableClient } = require('@azure/data-tables');
const sharp = require('sharp');
require('dotenv').config();

// Dynamically import node-fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Validate Environment Variables
const requiredEnvVars = [
    'AZURE_EVENT_HUB_CONNECTION_STRING',
    'AZURE_EVENT_HUB_NAME',
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_TABLES_CONNECTION_STRING',
    'AZURE_TABLES_NAME',
    'AZURE_STORAGE_CONTAINER_NAME',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`[Error] Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}

// Connection Strings and Configurations
const eventHubConnectionString = process.env.AZURE_EVENT_HUB_CONNECTION_STRING;
const eventHubName = process.env.AZURE_EVENT_HUB_NAME;
const blobConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableConnectionString = process.env.AZURE_TABLES_CONNECTION_STRING;
const tableName = process.env.AZURE_TABLES_NAME;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const consumerGroup = '$Default';

// Initialize Clients
const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
const tableClient = TableClient.fromConnectionString(tableConnectionString, tableName);

async function processThumbnail(imageUrl, partitionKey, rowKey) {
    try {
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobName = `${partitionKey}/thumbnails/${rowKey}_thumbnail.jpg`;
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);

        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`);
        }

        const imageBuffer = await response.arrayBuffer();
        const thumbnailBuffer = await sharp(Buffer.from(imageBuffer)).resize(100, 100).toBuffer();

        await blockBlobClient.uploadData(thumbnailBuffer, {
            blobHTTPHeaders: { blobContentType: 'image/jpeg' },
        });

        return blockBlobClient.url;
    } catch (error) {
        console.error(`[processThumbnail] Error processing thumbnail: ${error.message}`);
        throw error;
    }
}

async function updateTableEntry(partitionKey, rowKey, thumbnailUrl) {
    try {
        const entity = await tableClient.getEntity(partitionKey, rowKey);
        entity.thumbnailUrl = thumbnailUrl;
        await tableClient.updateEntity(entity, 'Merge');
        console.log(`[updateTableEntry] Updated table entry`);
    } catch (error) {
        console.error(`[updateTableEntry] Error updating table entry: ${error.message}`);
    }
}

async function updateProductQuantity(partitionKey, rowKey, quantityChange) {
    try {
        const entity = await tableClient.getEntity(partitionKey, rowKey);

        let originalQuantity = parseInt(entity.quantity, 10);
        if (isNaN(originalQuantity)) {
            if (quantityChange < 0) {
                console.error(`[updateProductQuantity] Quantity not found. Skipping subtraction.`);
                return;
            }
            originalQuantity = 0;
        }

        const updatedQuantity = originalQuantity + quantityChange;

        if (updatedQuantity < 0) {
            console.warn(`[updateProductQuantity] Quantity cannot be negative. Skipping update.`);
            return;
        }

        entity.quantity = updatedQuantity;
        await tableClient.updateEntity(entity, 'Merge');
        console.log(`[updateProductQuantity] Updated quantity to ${updatedQuantity}`);
    } catch (error) {
        console.error(`[updateProductQuantity] Error updating quantity: ${error.message}`);
    }
}

async function handleEvent(eventData) {
    const { action, productId, imageUrl, sellerId, cartItems } = eventData;
    const eventName = eventData.eventName || action;

    if (!eventName) {
        console.error('[handleEvent] Missing event name.');
        return;
    }

    console.log(`[handleEvent] Processing event: ${eventName}`);

    if (eventName === 'seller_added_product') {
        if (!productId || !imageUrl || !sellerId) {
            console.error('[handleEvent] Missing required fields.');
            return;
        }

        try {
            const thumbnailUrl = await processThumbnail(imageUrl, sellerId, productId);
            await updateTableEntry(sellerId, productId, thumbnailUrl);
        } catch (error) {
            console.error(`[handleEvent] Error processing seller_added_product: ${error.message}`);
        }
    } else if (eventName === 'view_cart' || eventName === 'leave_cart') {
        if (!cartItems || cartItems.length === 0) {
            console.error(`[handleEvent] Missing cart items.`);
            return;
        }

        for (const item of cartItems) {
            const { rowKey, partitionKey, userQuantity } = item;

            if (!rowKey || !partitionKey || userQuantity === undefined) {
                console.error(`[handleEvent] Missing fields in cart item.`);
                continue;
            }

            const quantityChange = eventName === 'view_cart' ? -parseInt(userQuantity, 10) : parseInt(userQuantity, 10);

            try {
                await updateProductQuantity(partitionKey, rowKey, quantityChange);
            } catch (error) {
                console.error(`[handleEvent] Error processing ${eventName}: ${error.message}`);
            }
        }
    } else {
        console.error(`[handleEvent] Unsupported event: ${eventName}`);
    }
}

async function main() {
    try {
        const consumerClient = new EventHubConsumerClient(consumerGroup, eventHubConnectionString, eventHubName);

        consumerClient.subscribe({
            processEvents: async (events) => {
                for (const event of events) {
                    try {
                        console.log(`[main] Received event:`, event.body);
                        await handleEvent(event.body);
                    } catch (error) {
                        console.error(`[handleEvent] Error processing event: ${error.message}`);
                    }
                }
            },
            processError: async (err) => {
                console.error(`[processError] Error: ${err.message}`);
            },
        });

        console.log(`[main] Event Hub consumer started.`);
    } catch (error) {
        console.error(`[main] Error starting Event Hub consumer: ${error.message}`);
    }
}

main().catch((err) => console.error(`[main] Uncaught Error: ${err.message}`));
