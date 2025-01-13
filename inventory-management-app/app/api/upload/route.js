import { NextResponse } from 'next/server';
import { BlobServiceClient } from '@azure/storage-blob';
import { TableClient } from '@azure/data-tables';
import { EventHubProducerClient } from '@azure/event-hubs';
import { v4 as uuidv4 } from 'uuid';

// Environment Variables
const blobConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableConnectionString = process.env.AZURE_TABLES_CONNECTION_STRING;
const tableName = process.env.AZURE_TABLES_NAME;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;
const eventHubConnectionString = process.env.AZURE_EVENT_HUB_CONNECTION_STRING;
const eventHubName = process.env.AZURE_EVENT_HUB_NAME;

if (!blobConnectionString || !tableConnectionString || !tableName || !containerName || !eventHubConnectionString || !eventHubName) {
    throw new Error('Missing one or more required environment variables. Check your .env file.');
}

// Blob Service, Table Client, and Event Hub Producer Initialization
const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
const tableClient = TableClient.fromConnectionString(tableConnectionString, tableName);
const eventHubProducer = new EventHubProducerClient(eventHubConnectionString, eventHubName);

/**
 * Safe JSON parsing function.
 * @param {string} jsonString - The JSON string to parse.
 * @returns {object|null} - Parsed object or null if parsing fails.
 */
function safeParseJSON(jsonString) {
    try {
        return JSON.parse(jsonString);
    } catch (error) {
        return null;
    }
}

/**
 * Utility function to send a message to Event Hub.
 * @param {string} productId - The product ID (rowKey).
 * @param {string} imageUrl - The URL of the product image.
 * @param {string} sellerId - The seller's unique identifier.
 */
async function sendMessageToEventHub(productId, imageUrl, sellerId) {
    const message = {
        eventName: 'seller_added_product',
        productId,
        imageUrl,
        sellerId,
    };

    console.log(`[sendMessageToEventHub] Sending message:`, message);

    try {
        const batch = await eventHubProducer.createBatch();
        if (!batch.tryAdd({ body: message })) {
            console.error(`[sendMessageToEventHub] Message too large to add to batch.`);
            return;
        }

        await eventHubProducer.sendBatch(batch);
        console.log(`[sendMessageToEventHub] Message sent successfully.`);
    } catch (error) {
        console.error(`[sendMessageToEventHub] Error sending message:`, error.message);
    }
}

/**
 * Function to upload files to Azure Blob Storage.
 * @param {Array} files - Array of File objects.
 * @param {string} sellerId - Seller's unique identifier for grouping blobs.
 * @returns {Promise<string>} - A comma-separated string of URLs of uploaded blobs.
 */
async function uploadFilesToBlob(files, sellerId) {
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const uploadedUrls = [];

    for (const file of files) {
        const blockBlobClient = containerClient.getBlockBlobClient(`${sellerId}/${uuidv4()}_${file.name}`);
        const fileBuffer = await file.arrayBuffer();

        await blockBlobClient.uploadData(fileBuffer, {
            blobHTTPHeaders: { blobContentType: file.type },
        });

        uploadedUrls.push(blockBlobClient.url);
    }

    console.log(`[uploadFilesToBlob] Uploaded image URLs:`, uploadedUrls);
    return uploadedUrls.join(',');
}

/**
 * Function to add product details (excluding empty fields) to Table Storage
 * and then send a message to Event Hub.
 * @param {string} sellerId - Seller's unique identifier.
 * @param {object} productData - Product details.
 * @param {string} imageUrls - Comma-separated string of image URLs.
 */
async function addProductToTableAndSendMessage(sellerId, productData, imageUrls) {
    const rowKey = uuidv4();

    const productEntity = {
        partitionKey: sellerId,
        rowKey,
        imageUrls,
        ...Object.fromEntries(
            Object.entries(productData).filter(([_, value]) => value)
        ),
    };

    console.log(`[addProductToTableAndSendMessage] Adding product:`, productEntity);

    try {
        // Add the product to Table Storage
        await tableClient.createEntity(productEntity);
        console.log(`[addProductToTableAndSendMessage] Product added to table storage successfully.`);

        // Extract the first image URL for Event Hub
        const firstImageUrl = imageUrls.split(',')[0];
        if (!firstImageUrl) {
            console.error(`[addProductToTableAndSendMessage] No valid first image URL.`);
            return rowKey; // Return the rowKey even if no image URL
        }

        // Send message to Event Hub
        await sendMessageToEventHub(rowKey, firstImageUrl, sellerId);
        console.log(`[addProductToTableAndSendMessage] Message sent to Event Hub successfully.`);
    } catch (error) {
        console.error(`[addProductToTableAndSendMessage] Error:`, error.message);
        throw error; // Propagate the error to the calling function
    }

    return rowKey;
}

/**
 * Next.js API Route to handle the upload and store product with images.
 */
export async function POST(req) {
    const requestId = uuidv4();
    console.log(`[POST] Request ID: ${requestId} - Starting handler`);

    try {
        const formData = await req.formData();
        const sellerId = formData.get('sellerId');
        const productDataRaw = formData.get('productData');
        const files = formData.getAll('productImages');

        console.log(`[POST] Received request:`, { sellerId, productDataRaw, fileCount: files.length });

        if (!sellerId || !productDataRaw) {
            return NextResponse.json(
                { error: 'Missing required fields: sellerId or productData.' },
                { status: 400 }
            );
        }

        const productData = safeParseJSON(productDataRaw);
        if (!productData) {
            return NextResponse.json(
                { error: 'Invalid productData format.' },
                { status: 400 }
            );
        }

        const imageUrls = await uploadFilesToBlob(files, sellerId);
        if (!imageUrls) {
            return NextResponse.json(
                { error: 'File upload failed.' },
                { status: 500 }
            );
        }

        const rowKey = await addProductToTableAndSendMessage(sellerId, productData, imageUrls);

        console.log(`[POST] Request ID: ${requestId} - Product added successfully for seller ${sellerId}`);

        return NextResponse.json({
            message: 'Product added successfully.',
            rowKey,
        });
    } catch (error) {
        console.error(`[POST] Request ID: ${requestId} - Error:`, error.stack || error.message);

        return NextResponse.json(
            { error: 'Internal server error.', details: error.message },
            { status: 500 }
        );
    }
}
