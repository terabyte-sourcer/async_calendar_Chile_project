try:
    from app.api.routes import availability
    print("Successfully imported availability module")
except Exception as e:
    print(f"Error importing availability module: {e}") 