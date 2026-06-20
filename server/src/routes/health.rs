use crate::state::AppState;

pub fn routes() -> axum::Router<AppState> {
    axum::Router::new().route("/", axum::routing::get(health_route))
}

async fn health_route() -> &'static str {
    "OK"
}
