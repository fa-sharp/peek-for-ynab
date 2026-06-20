use axum::{
    extract::{Query, State},
    response::{IntoResponse, Redirect},
};
use axum_extra::extract::{
    PrivateCookieJar,
    cookie::{Cookie, SameSite},
};
use reqwest::StatusCode;
use serde::{Deserialize, Serialize};
use subtle::ConstantTimeEq;

use crate::state::AppState;

pub fn oauth_routes() -> axum::Router<AppState> {
    axum::Router::new()
        .route("/login", axum::routing::get(login_route))
        .route("/callback", axum::routing::get(callback_route))
}

const OAUTH_COOKIE_NAME: &str = "peek-oauth-login";

#[derive(Debug, Serialize, Deserialize)]
struct OauthLoginData {
    state: String,
    pkce_verifier: String,
    redirect_uri: reqwest::Url,
}

#[derive(Debug, Deserialize)]
struct OauthLoginQuery {
    redirect_uri: reqwest::Url,
}

async fn login_route(
    Query(query): Query<OauthLoginQuery>,
    State(state): State<AppState>,
    cookies: PrivateCookieJar,
) -> Result<impl IntoResponse, StatusCode> {
    // Verify redirect URI is allowed
    if state
        .config
        .allowed_login_redirects
        .as_ref()
        .is_some_and(|allowed| !allowed.contains(&query.redirect_uri))
    {
        return Err(StatusCode::BAD_REQUEST);
    }

    // Generate authorization URL along with CSRF/state paramater and PKCE
    let (authorize_url, csrf_token, pkce_verifier) = state.oauth.authorize_url();

    // Create a temporary secure cookie to hold OAuth login values
    let login_data = OauthLoginData {
        state: csrf_token.into_secret(),
        pkce_verifier: pkce_verifier.into_secret(),
        redirect_uri: query.redirect_uri,
    };
    let cookie_str =
        serde_json::to_string(&login_data).map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let cookie = Cookie::build((OAUTH_COOKIE_NAME, cookie_str))
        .path(super::OAUTH_ROUTE_PREFIX)
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Lax)
        .expires(None); // Session expiration
    let cookie_jar = cookies.add(cookie);

    Ok((cookie_jar, Redirect::to(authorize_url.as_str())))
}

#[derive(Debug, Deserialize)]
struct OauthCallbackQuery {
    code: String,
    state: String,
}

async fn callback_route(
    Query(query): Query<OauthCallbackQuery>,
    State(state): State<AppState>,
    cookies: PrivateCookieJar,
) -> Result<impl IntoResponse, StatusCode> {
    // Read OAuth login data from the temporary cookie, and delete the cookie
    let oauth_cookie = cookies
        .get(OAUTH_COOKIE_NAME)
        .ok_or(StatusCode::BAD_REQUEST)?;
    let cookie_jar =
        cookies.remove(Cookie::build(OAUTH_COOKIE_NAME).path(super::OAUTH_ROUTE_PREFIX));
    let login: OauthLoginData =
        serde_json::from_str(oauth_cookie.value()).map_err(|_| StatusCode::BAD_REQUEST)?;

    // Verify state parameter
    if query.state.as_bytes().ct_ne(login.state.as_bytes()).into() {
        return Err(StatusCode::UNAUTHORIZED);
    }

    // Exchange code for token
    match state
        .oauth
        .exchange_code(query.code, login.pkce_verifier)
        .await
    {
        Ok(token_data) => {
            tracing::info!("OAuth login successful");
            let auth_token = state
                .crypto
                .encrypt_token(&token_data)
                .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
            let mut redirect_url = login.redirect_uri;
            redirect_url.set_fragment(Some(&format!("auth_token={auth_token}")));

            Ok((cookie_jar, Redirect::to(redirect_url.as_str())))
        }
        Err(err) => {
            tracing::warn!("Error while exchanging OAuth code: {err}");

            Err(StatusCode::UNAUTHORIZED)
        }
    }
}
