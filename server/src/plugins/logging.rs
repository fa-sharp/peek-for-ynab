use std::str::FromStr;

use anyhow::Context;
use axum::{extract::Request, http::HeaderName};
use axum_plugin::AdHocPlugin;
use tower::ServiceBuilder;
use tower_http::{
    request_id::{MakeRequestUuid, PropagateRequestIdLayer, SetRequestIdLayer},
    trace::{DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::{Level, level_filters::LevelFilter};

use crate::state::AppState;

pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("Request logs").on_setup(|router, state: &AppState| {
        if LevelFilter::from_str(&state.config.log_level)? > LevelFilter::INFO {
            return Ok(router);
        }

        const LEVEL: Level = Level::INFO;
        let request_id_header = Box::leak(Box::new(
            HeaderName::from_str(&state.config.request_id_header)
                .context("invalid request ID header")?,
        ));

        let trace_layer = TraceLayer::new_for_http()
            .make_span_with(|req: &Request| {
                tracing::info_span!(
                    "request",
                    method = %req.method(),
                    uri = %req.uri(),
                    id = req.headers().get(&*request_id_header).and_then(|id| id.to_str().ok()),
                )
            })
            .on_request(DefaultOnRequest::new().level(LEVEL))
            .on_response(DefaultOnResponse::new().level(LEVEL).include_headers(true));
        let logging_service = ServiceBuilder::new()
            .layer(SetRequestIdLayer::new(
                request_id_header.clone(),
                MakeRequestUuid::default(),
            ))
            .layer(trace_layer)
            .layer(PropagateRequestIdLayer::new(request_id_header.clone()));

        Ok(router.layer(logging_service))
    })
}
