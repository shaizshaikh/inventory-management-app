import { TableClient } from '@azure/data-tables';

// Use environment variables for connection strings and table names
const connectionString = process.env.AZURE_TABLES_CONNECTION_STRING; // Connection string
const tableName = process.env.AZURE_TABLES_NAME; // Table name

export async function POST(req) {
  try {
    // Parse the request body to get partitionKey, rowKey, and product data
    const { partitionKey, rowKey, productData } = await req.json();

    // Validate required fields
    if (!partitionKey || !rowKey || !productData) {
      return new Response(
        JSON.stringify({ message: 'PartitionKey, RowKey, and product data are required' }),
        { status: 400 }
      );
    }

    // Initialize the Azure Table Client
    const client = TableClient.fromConnectionString(connectionString, tableName);

    // Retrieve the existing entity using partitionKey and rowKey
    const entity = await client.getEntity(partitionKey, rowKey); // Corrected: partitionKey and rowKey

    // Merge the existing entity with the new product data
    const updatedEntity = { ...entity, ...productData };

    // Ensure the partitionKey and rowKey are set correctly
    updatedEntity.partitionKey = partitionKey;  // PartitionKey = partitionKey
    updatedEntity.rowKey = rowKey;              // RowKey = rowKey

    // Upsert (update or insert) the entity in the table
    await client.upsertEntity(updatedEntity, 'Merge');

    return new Response(
      JSON.stringify({ message: 'Product updated successfully' }),
      { status: 200 }
    );
  } catch (err) {
    // Log and return an error response
    console.error('Error updating product:', err.message || err);
    return new Response(
      JSON.stringify({ message: 'Error updating product' }),
      { status: 500 }
    );
  }
}
