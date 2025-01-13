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

async function fetchProducts() {
    try {
        console.log('Fetching products from Azure Table Storage...');
        const entities = [];
        const entityIter = tableClient.listEntities();

        for await (const entity of entityIter) {
            const product = {
                rowKey: entity.rowKey,
                description: entity.description || '',
                price: entity.price || 0,
                size: entity.size || '',
                color: entity.color || '',
                material: entity.material || '',
                quantity: entity.quantity || 0,
                shipping: entity.shipping || '',
                ...entity,
            };
            entities.push(product);
        }

        console.log('Fetched products:', entities);
        return entities;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products');
    }
}

// API Endpoint to fetch all products
export async function GET() {
    try {
        const products = await fetchProducts();
        return NextResponse.json({ products });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
