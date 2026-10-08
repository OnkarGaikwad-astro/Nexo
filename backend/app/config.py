import os

def get_sim_url() -> str:
    """Resolves company simulator URL across any environment variable name, stripping trailing slashes."""
    url = (
        os.getenv("COMPANY_SIM_URL")
        or os.getenv("SIM_APP_URL")
        or os.getenv("SIM_URL")
        or os.getenv("NEXT_PUBLIC_SIM_URL")
        or "http://localhost:3001"
    )
    return url.strip().rstrip("/")

def get_backend_url() -> str:
    """Resolves backend API URL across any environment variable name, stripping trailing slashes."""
    url = (
        os.getenv("BACKEND_URL")
        or os.getenv("API_URL")
        or os.getenv("NEXT_PUBLIC_API_URL")
        or "http://localhost:8000"
    )
    return url.strip().rstrip("/")
