//! Health probe endpoints for Kubernetes / container orchestration.
//!
//! Both routes are intentionally on the public (un-auth) side of the router
//! so kubelet — which can't carry a bearer token — can reach them.
//!
//! ## Liveness vs readiness
//!
//! - **Liveness** (`/healthz`) — "is the process still working at all?". A
//!   failing liveness probe causes the kubelet to restart the pod. Returns
//!   200 as long as the Axum runtime is responding.
//!
//! - **Readiness** (`/readyz`) — "should this pod receive traffic?". A
//!   failing readiness probe takes the pod out of the Service's endpoints
//!   without restarting it. By the time the HTTP listener accepts a request,
//!   the daemon's state (PTY manager, auth token, hook registry) has been
//!   fully initialized, so this also returns 200 today. Kept as a distinct
//!   endpoint so future readiness checks (e.g. PVC writeability, upstream
//!   reachability) have a clear home.

use axum::http::StatusCode;
use axum::response::IntoResponse;

pub async fn liveness_handler() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}

pub async fn readiness_handler() -> impl IntoResponse {
    (StatusCode::OK, "ok")
}
