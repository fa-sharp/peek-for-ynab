use axum::{
    extract::FromRequestParts,
    http::{StatusCode, header},
};

use crate::{state::AppState, types::TokenData};

/// Guard that decrypts the token in the auth header
pub struct TokenGuard(pub TokenData);

impl FromRequestParts<AppState> for TokenGuard {
    type Rejection = StatusCode;

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get(&header::AUTHORIZATION)
            .ok_or(StatusCode::UNAUTHORIZED)?
            .to_str()
            .map_err(|_| StatusCode::UNAUTHORIZED)?;
        let data = state
            .crypto
            .decrypt_token(token)
            .map_err(|_| StatusCode::UNAUTHORIZED)?;

        Ok(Self(data))
    }
}
