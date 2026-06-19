use std::str::FromStr;

use axum_plugin::AdHocPlugin;
use tower_http::{
    LatencyUnit,
    trace::{DefaultMakeSpan, DefaultOnRequest, DefaultOnResponse, TraceLayer},
};
use tracing::{Level, level_filters::LevelFilter};

use crate::state::AppState;

pub fn plugin() -> AdHocPlugin<AppState> {
    AdHocPlugin::named("Request logs").on_setup(|router, state: &AppState| {
        if LevelFilter::from_str(&state.config.log_level)? > LevelFilter::INFO {
            return Ok(router);
        }

        const LEVEL: Level = Level::INFO;
        let log_layer = TraceLayer::new_for_http()
            .make_span_with(DefaultMakeSpan::new().level(LEVEL))
            .on_request(DefaultOnRequest::new().level(LEVEL))
            .on_response(
                DefaultOnResponse::new()
                    .level(LEVEL)
                    .latency_unit(LatencyUnit::Millis),
            );

        Ok(router.layer(log_layer))
    })
}
