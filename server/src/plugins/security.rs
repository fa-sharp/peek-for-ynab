use std::time::Duration;

use axum::http::StatusCode;
use axum_plugin::AdHocPlugin;
use tower::ServiceBuilder;
use tower_http::{limit::RequestBodyLimitLayer, timeout::TimeoutLayer};

use crate::state::AppState;

pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("Security").on_setup(|router, _state| {
        let security_layer = ServiceBuilder::new()
            .layer(RequestBodyLimitLayer::new(10 * 1024))
            .layer(TimeoutLayer::with_status_code(
                StatusCode::REQUEST_TIMEOUT,
                Duration::from_secs(60),
            ));

        Ok(router.layer(security_layer))
    })
}
