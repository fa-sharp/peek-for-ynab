use std::time::Duration;

use axum::http::StatusCode;
use tower::ServiceBuilder;
use tower_http::{limit::RequestBodyLimitLayer, timeout::TimeoutLayer};

use crate::Plugin;

pub fn plugin() -> Plugin {
    Plugin::named("Security").global_setup(|_app, router| {
        let security_layer = ServiceBuilder::new()
            .layer(RequestBodyLimitLayer::new(5 * 1024))
            .layer(TimeoutLayer::with_status_code(
                StatusCode::REQUEST_TIMEOUT,
                Duration::from_secs(60),
            ));

        Ok(router.layer(security_layer))
    })
}
