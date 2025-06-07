from fastapi.testclient import TestClient

from main import app

client = TestClient(app)

def test_get_ai_coach_messages():
    response = client.get('/routes/ai-coach-messages/')
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3
