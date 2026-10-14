def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "UP"}


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "TaskBoard API"


def test_ready(client):
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json() == {"status": "READY"}


def test_create_task(client):
    response = client.post(
        "/api/tasks",
        json={"title": "Deploy application", "priority": "HIGH", "assignee": "Student"},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Deploy application"
    assert body["status"] == "TODO"
    assert "id" in body


def test_create_task_requires_title(client):
    response = client.post("/api/tasks", json={"title": ""})
    assert response.status_code == 422


def test_list_tasks(client):
    client.post("/api/tasks", json={"title": "Task 1"})
    client.post("/api/tasks", json={"title": "Task 2"})
    response = client.get("/api/tasks")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_task(client):
    created = client.post("/api/tasks", json={"title": "Fetch me"}).json()
    response = client.get(f"/api/tasks/{created['id']}")
    assert response.status_code == 200
    assert response.json()["title"] == "Fetch me"


def test_get_task_not_found(client):
    response = client.get("/api/tasks/999")
    assert response.status_code == 404


def test_update_task(client):
    created = client.post("/api/tasks", json={"title": "Old title"}).json()
    response = client.put(f"/api/tasks/{created['id']}", json={"status": "DONE"})
    assert response.status_code == 200
    assert response.json()["status"] == "DONE"
    assert response.json()["title"] == "Old title"


def test_delete_task(client):
    created = client.post("/api/tasks", json={"title": "Delete me"}).json()
    response = client.delete(f"/api/tasks/{created['id']}")
    assert response.status_code == 204
    assert client.get(f"/api/tasks/{created['id']}").status_code == 404


def test_stats(client):
    client.post("/api/tasks", json={"title": "A", "status": "TODO"})
    client.post("/api/tasks", json={"title": "B", "status": "DONE"})
    response = client.get("/api/tasks/stats")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    assert body["todo"] == 1
    assert body["done"] == 1
