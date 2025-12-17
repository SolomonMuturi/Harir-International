// PATCH endpoint for updating packaging material stock
export async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Material ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Find the material in mock data
    const materialIndex = mockPackagingMaterials.findIndex(m => m.id === id);
    
    if (materialIndex === -1) {
      return NextResponse.json(
        { error: 'Packaging material not found' },
        { status: 404 }
      );
    }

    // Update the material
    mockPackagingMaterials[materialIndex] = {
      ...mockPackagingMaterials[materialIndex],
      ...body,
      lastUsedDate: new Date().toISOString(),
    };

    return NextResponse.json(mockPackagingMaterials[materialIndex]);
    
  } catch (error) {
    console.error('Error updating packaging material:', error);
    return NextResponse.json(
      { error: 'Failed to update packaging material' },
      { status: 500 }
    );
  }
}