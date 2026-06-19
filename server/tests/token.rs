use axum::http::StatusCode;
use axum_test::TestServer;
use httpmock::MockServer;
use peek_server::{create_app, plugins::crypto::CryptoService, types::TokenData, util::now_secs};

fn mock_oauth_server() -> MockServer {
    let server = MockServer::start();
    server.mock(|when, then| {
        when.method(httpmock::Method::POST)
            .path("/oauth/token")
            .form_urlencoded_tuple("grant_type", "refresh_token")
            .form_urlencoded_tuple_exists("refresh_token");
        then.status(200)
            .header("content-type", "application/json")
            .json_body(serde_json::json!({
                "access_token": "new-access-token",
                "refresh_token": "new-refresh-token",
                "token_type": "bearer",
                "expires_in": 7200,
            }));
    });

    server
}

fn crypto_service(token_key: &[u8]) -> CryptoService {
    use aes_gcm::{Aes256Gcm, KeyInit};

    let cipher = Aes256Gcm::new_from_slice(token_key).unwrap();
    let crypto = CryptoService::new(cipher);
    crypto
}

#[tokio::test]
async fn refresh_expired_token() {
    let oauth_server = mock_oauth_server();
    let config = vec![("ynab_base_url".into(), oauth_server.base_url())];

    let app = create_app(Some(config)).await.unwrap();
    let server = TestServer::new(app.router());
    let crypto = crypto_service(&app.state().config.token_key);

    let expired_token = crypto
        .encrypt_token(&TokenData {
            access_token: "access".into(),
            refresh_token: "refresh".into(),
            expires: (now_secs() + 2 * 60) * 1000, // expires in 2 minutes, should be refreshed
        })
        .unwrap();

    let response = server.post("/api/token").authorization(expired_token).await;
    assert_eq!(response.status_code(), StatusCode::OK);

    let json_response: serde_json::Value = response.json();
    assert_eq!(json_response["accessToken"], "new-access-token");

    let decrypted_token = crypto
        .decrypt_token(json_response["authToken"].as_str().unwrap())
        .unwrap();
    assert_eq!(decrypted_token.access_token, "new-access-token");
    assert_eq!(decrypted_token.refresh_token, "new-refresh-token");
}

#[tokio::test]
async fn keep_fresh_token() {
    let oauth_server = mock_oauth_server();
    let config = vec![("ynab_base_url".into(), oauth_server.base_url())];

    let app = create_app(Some(config)).await.unwrap();
    let server = TestServer::new(app.router());
    let crypto = crypto_service(&app.state().config.token_key);

    let fresh_token = crypto
        .encrypt_token(&TokenData {
            access_token: "current-access".into(),
            refresh_token: "current-refresh".into(),
            expires: (now_secs() + 30 * 60) * 1000, // expires in 30 minutes, should not be refreshed
        })
        .unwrap();

    let response = server.post("/api/token").authorization(fresh_token).await;
    assert_eq!(response.status_code(), StatusCode::OK);

    let json_response: serde_json::Value = response.json();
    assert_eq!(json_response["accessToken"], "current-access");
    assert_eq!(json_response["authToken"], serde_json::Value::Null);
}
