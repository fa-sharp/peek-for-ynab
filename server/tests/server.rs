use axum::http::{StatusCode, header};
use axum_test::TestServer;
use peek_server::create_app;

#[tokio::test]
async fn should_start() {
    let app = create_app(None).await.unwrap();
    let server = TestServer::new(app.router());
    let response = server.get("/api/health").await;
    assert!(response.status_code().is_success());
}

#[tokio::test]
async fn serves_static_website() {
    let app = create_app(None).await.unwrap();
    let server = TestServer::new(app.router());

    for path in ["/", "/help/", "/releases/", "/privacy/"] {
        let response = server.get(path).await;
        assert_eq!(response.status_code(), StatusCode::OK, "GET {path}");
        assert_eq!(response.content_type(), "text/html");
        for header in [header::STRICT_TRANSPORT_SECURITY, header::X_FRAME_OPTIONS] {
            assert!(response.maybe_header(header).is_some())
        }
    }
}

#[tokio::test]
async fn api_cors_headers() {
    let app = create_app(None).await.unwrap();
    let server = TestServer::new(app.router());

    let allowed_origin = app
        .state()
        .config
        .allowed_origins
        .as_ref()
        .and_then(|origins| origins.first().map(|o| o.as_str()));
    let request_origin = allowed_origin.unwrap_or("http://random");

    // Proper CORS origin header
    for path in ["/api/token", "/api/token/logout"] {
        let response = server
            .post(path)
            .add_header(header::ORIGIN, request_origin)
            .await;
        assert_eq!(
            response.header(header::ACCESS_CONTROL_ALLOW_ORIGIN),
            allowed_origin.unwrap_or("*")
        );
    }

    // No CORS headers for static pages
    for path in ["/", "/help/"] {
        let response = server
            .get(path)
            .add_header(header::ORIGIN, request_origin)
            .await;
        assert_eq!(
            response.maybe_header(header::ACCESS_CONTROL_ALLOW_ORIGIN),
            None
        );
    }
}

#[tokio::test]
async fn body_limit() {
    let app = create_app(None).await.unwrap();
    let server = TestServer::new(app.router());

    let big_body = vec![0u8; 6 * 1024];
    let response = server
        .post("/api/token")
        .add_header(header::CONTENT_LENGTH, big_body.len())
        .bytes(big_body.into())
        .await;
    assert_eq!(response.status_code(), StatusCode::PAYLOAD_TOO_LARGE);
}
