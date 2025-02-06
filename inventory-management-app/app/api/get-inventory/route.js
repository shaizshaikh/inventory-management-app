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
        const { sellerId } = await req.json();

        if (!sellerId) {
            return NextResponse.json({ error: 'Seller ID is required.' }, { status: 400 });
        }

        // Fetch all products for the seller
        const products = [];
        const entityIter = tableClient.listEntities({
            queryOptions: { filter: `PartitionKey eq '${sellerId}'` },
        });

        for await (const entity of entityIter) {
            products.push(entity);
        }

        // Log fetched products for debugging
        console.log('Fetched Products:', products);

        // Aggregate inventory data
        const clothingProducts = products; // Assume all products belong to "Clothing" category

        const inventoryData = {
            totalItems: clothingProducts.length,
            categories: ['Clothing'], // Static category
            lowStockItems: clothingProducts.filter(product => {
                const quantity = Number(product.quantity) || 0; // Ensure quantity is a number
                return quantity <= 5;
            }).length,
            recentActivity: clothingProducts.slice(0, 5).map(product => {
                const title = product.productTitle || 'Unknown Product'; // Handle undefined title
                const quantity = Number(product.quantity) || 0;
                return `Added/Updated product: "${title}" (${quantity} in stock)`;
            }),
        };

        // Return the aggregated inventory data
        return NextResponse.json(inventoryData);
    } catch (error) {
        console.error('Error fetching inventory data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch inventory data' },
            { status: 500 }
        );
    }
}
