import { TableClient } from '@azure/data-tables';
import { NextResponse } from 'next/server';

// Environment Variables
const tableConnectionString = process.env.AZURE_TABLES_CONNECTION_STRING;
const tableName = process.env.AZURE_TABLES_NAME;

if (!tableConnectionString || !tableName) {
    throw new Error('Missing required environment variables.');
}

// Initialize Table Client
const tableClient = TableClient.fromConnectionString(tableConnectionString, tableName);

export async function POST(req) {
    try {
        const body = await req.json();
        const { sellerId, limit = 5 } = body; // Default limit is 5 if not provided

        if (!sellerId) {
            return NextResponse.json({ error: 'Seller ID is required.' }, { status: 400 });
        }

        // Fetch products for the seller
        const entities = [];
        const entityIter = tableClient.listEntities({
            queryOptions: { filter: `PartitionKey eq '${sellerId}'` },
        });

        // Collect products with pagination
        let count = 0;
        for await (const entity of entityIter) {
            if (count >= limit) break; // Stop once we reach the limit
            entities.push(entity);
            count++;
        }

        // Sort by timestamp to ensure the most recent products come first
        entities.sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));

        // Return the fetched products
        return NextResponse.json({ products: entities });
    } catch (error) {
        console.error('Error fetching products:', error);
        return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
    }
}
