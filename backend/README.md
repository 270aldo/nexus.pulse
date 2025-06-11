# Backend API

This directory contains the FastAPI application that powers the Nexus Pulse backend.

## Installation

The backend uses `uv` to create a virtual environment and install dependencies. Run the install script from the `backend` directory:

```bash
./install.sh
```

This will create `.venv` and install packages listed in `requirements.txt`. You can also execute `make install-backend` from the repository root which runs the same script.

## Environment variables

The API expects a few environment variables or secrets to be available:

- `SUPABASE_URL` and `SUPABASE_ANON_KEY` – connection details for Supabase used by the `health_data` routes.
- `DATABUTTON_SERVICE_TYPE` – when set to `prodx` the application runs in production mode; otherwise development mode is assumed.
- `DATABUTTON_EXTENSIONS` – optional JSON string describing Databutton extensions. If it contains the `firebase-auth` extension, authentication is configured automatically.

Copy `.env.example` to `.env` and set these values when running locally. `main.py` loads this file via `dotenv` on startup.

Example:

```ini
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=your_anon_key
DATABUTTON_EXTENSIONS=[]
```

## Running the API

Activate the virtual environment and start Uvicorn:

```bash
source .venv/bin/activate
uvicorn main:app --reload
```

You may also run `./run.sh` or `make run-backend` from the project root. The API will be available on <http://localhost:8000> and the interactive docs at <http://localhost:8000/docs>.

## `routers.json`

`routers.json` controls which API routes are loaded and whether authentication is required. The file contains a `routers` object with an entry for each package in `app/apis`. Example:

```json
{
  "routers": {
    "health_data": { "name": "health_data", "version": "2025-05-18T00:45:21", "disableAuth": false },
    "ai_coach_messages_api": { "name": "ai_coach_messages_api", "version": "2025-05-26T05:57:06", "disableAuth": false }
  }
}
```

During startup `main.py` reads this file in `import_api_routers()`. For each router module found it checks the `disableAuth` flag: if `false`, `get_authorized_user` is injected as a dependency so requests must be authenticated; if `true`, the router is mounted without this dependency. Removing an entry or setting `disableAuth` to `true` lets you expose routes without authentication.
