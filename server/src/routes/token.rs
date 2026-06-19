use axum::{Json, extract::State, http::StatusCode};
use serde::Serialize;

use crate::{guard::TokenGuard, state::AppState, util::now_secs};

pub fn routes() -> axum::Router<AppState> {
    axum::Router::new()
        .route("/", axum::routing::post(get_token_route))
        .route("/logout", axum::routing::post(logout_route))
}

/** Minimum time the access token should be fresh (20 minutes) */
const TOKEN_FRESH_SECONDS: u64 = 20 * 60;

async fn get_token_route(
    TokenGuard(token): TokenGuard,
    State(state): State<AppState>,
) -> Result<Json<AccessTokenResponse>, StatusCode> {
    if token.expires < (now_secs() + TOKEN_FRESH_SECONDS) * 1000 {
        match state.oauth.refresh(token.refresh_token).await {
            Ok(new_token) => {
                let auth_token = state
                    .crypto
                    .encrypt_token(&new_token)
                    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

                Ok(Json(AccessTokenResponse {
                    access_token: new_token.access_token,
                    auth_token: Some(auth_token),
                }))
            }
            Err(err) => {
                tracing::warn!("Error refreshing token: {err}");

                Err(StatusCode::UNAUTHORIZED)
            }
        }
    } else {
        Ok(Json(AccessTokenResponse {
            access_token: token.access_token,
            auth_token: None,
        }))
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AccessTokenResponse {
    access_token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    auth_token: Option<String>,
}

async fn logout_route(TokenGuard(token): TokenGuard, State(state): State<AppState>) -> StatusCode {
    if let Err(err) = state.oauth.revoke(token.refresh_token).await {
        tracing::warn!("Failed to revoke token: {err}");
    }

    StatusCode::NO_CONTENT
}
