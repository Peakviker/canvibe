use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::Json,
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct AppState {
    pub events: Arc<Mutex<Vec<serde_json::Value>>>,
    pub nodes: Arc<Mutex<Vec<serde_json::Value>>>,
    pub canvas_state: Arc<Mutex<HashMap<String, serde_json::Value>>>,
}

#[derive(Serialize, Deserialize)]
pub struct EventRequest {
    pub event_type: String,
    pub data: serde_json::Value,
}

#[derive(Serialize)]
pub struct ApiResponse {
    pub success: bool,
    pub message: String,
    pub data: Option<serde_json::Value>,
}

pub fn create_api_router(state: AppState) -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/events", get(get_events).post(create_event))
        .route("/events/:id", get(get_event))
        .route("/nodes", get(get_nodes).post(create_node))
        .route("/canvas/state", get(get_canvas_state).post(update_canvas_state))
        .route("/canvas/zoom", post(set_zoom))
        .route("/canvas/position", post(set_position))
        .layer(tower_http::cors::CorsLayer::permissive())
        .with_state(state)
}

async fn health_check() -> Json<ApiResponse> {
    Json(ApiResponse {
        success: true,
        message: "Canvibe API is running".to_string(),
        data: Some(serde_json::json!({
            "version": "0.1.0",
            "status": "healthy"
        })),
    })
}

async fn get_events(
    State(state): State<AppState>,
    Query(params): Query<HashMap<String, String>>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let events = state.events.lock().await;
    
    let filtered: Vec<serde_json::Value> = if let Some(event_type) = params.get("type") {
        events
            .iter()
            .filter(|e| e.get("type").and_then(|t| t.as_str()) == Some(event_type.as_str()))
            .cloned()
            .collect()
    } else {
        events.clone()
    };

    Ok(Json(ApiResponse {
        success: true,
        message: format!("Found {} events", filtered.len()),
        data: Some(serde_json::json!(filtered)),
    }))
}

async fn create_event(
    State(state): State<AppState>,
    Json(event): Json<EventRequest>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let mut events = state.events.lock().await;
    
    let new_event = serde_json::json!({
        "id": format!("evt_{}_{}", chrono::Utc::now().timestamp_millis(), uuid::Uuid::new_v4().to_string().replace("-", "").chars().take(8).collect::<String>()),
        "type": event.event_type,
        "timestamp": chrono::Utc::now().to_rfc3339(),
        "data": event.data,
    });

    events.push(new_event.clone());

    Ok(Json(ApiResponse {
        success: true,
        message: "Event created".to_string(),
        data: Some(new_event),
    }))
}

async fn get_event(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let events = state.events.lock().await;
    
    let event = events.iter().find(|e| {
        e.get("id").and_then(|i| i.as_str()) == Some(id.as_str())
    });

    match event {
        Some(e) => Ok(Json(ApiResponse {
            success: true,
            message: "Event found".to_string(),
            data: Some(e.clone()),
        })),
        None => Err(StatusCode::NOT_FOUND),
    }
}

async fn get_nodes(State(state): State<AppState>) -> Json<ApiResponse> {
    let nodes = state.nodes.lock().await;
    
    Json(ApiResponse {
        success: true,
        message: format!("Found {} nodes", nodes.len()),
        data: Some(serde_json::json!(*nodes)),
    })
}

async fn create_node(
    State(state): State<AppState>,
    Json(node): Json<serde_json::Value>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let mut nodes = state.nodes.lock().await;
    
    let new_node = if !node.get("id").is_some() {
        let mut node = node.clone();
        node["id"] = serde_json::json!(format!("node_{}", uuid::Uuid::new_v4().to_string().replace("-", "").chars().take(8).collect::<String>()));
        node
    } else {
        node
    };

    nodes.push(new_node.clone());

    Ok(Json(ApiResponse {
        success: true,
        message: "Node created".to_string(),
        data: Some(new_node),
    }))
}

async fn get_canvas_state(State(state): State<AppState>) -> Json<ApiResponse> {
    let canvas_state = state.canvas_state.lock().await;
    
    Json(ApiResponse {
        success: true,
        message: "Canvas state retrieved".to_string(),
        data: Some(serde_json::json!(*canvas_state)),
    })
}

async fn update_canvas_state(
    State(state): State<AppState>,
    Json(updates): Json<HashMap<String, serde_json::Value>>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let mut canvas_state = state.canvas_state.lock().await;
    
    for (key, value) in updates {
        canvas_state.insert(key, value);
    }

    Ok(Json(ApiResponse {
        success: true,
        message: "Canvas state updated".to_string(),
        data: Some(serde_json::json!(*canvas_state)),
    }))
}

#[derive(Deserialize)]
struct ZoomRequest {
    zoom: f64,
}

#[derive(Deserialize)]
struct PositionRequest {
    x: f64,
    y: f64,
}

async fn set_zoom(
    State(state): State<AppState>,
    Json(req): Json<ZoomRequest>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let mut canvas_state = state.canvas_state.lock().await;
    canvas_state.insert("zoom".to_string(), serde_json::json!(req.zoom));

    Ok(Json(ApiResponse {
        success: true,
        message: format!("Zoom set to {}", req.zoom),
        data: Some(serde_json::json!({"zoom": req.zoom})),
    }))
}

async fn set_position(
    State(state): State<AppState>,
    Json(req): Json<PositionRequest>,
) -> Result<Json<ApiResponse>, StatusCode> {
    let mut canvas_state = state.canvas_state.lock().await;
    canvas_state.insert("position".to_string(), serde_json::json!({
        "x": req.x,
        "y": req.y
    }));

    Ok(Json(ApiResponse {
        success: true,
        message: format!("Position set to ({}, {})", req.x, req.y),
        data: Some(serde_json::json!({"x": req.x, "y": req.y})),
    }))
}
