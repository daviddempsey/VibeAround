//! Standalone VibeAround server binary — starts the ServerDaemon from the command line.

use std::path::PathBuf;

fn main() -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    common::logging::init();
    let daemon = server::ServerDaemon::new(common::config::DEFAULT_PORT);
    // Container deployments mount the bundle at a fixed absolute path
    // (`/opt/vibearound/web/dist`); developer runs from `src/` and want
    // the relative default. `DIST_PATH` lets either work without WORKDIR
    // gymnastics in the Dockerfile.
    let dist_path = std::env::var_os("DIST_PATH")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("web").join("dist"));

    let rt = tokio::runtime::Runtime::new()?;
    rt.block_on(async {
        if let Err(e) = daemon.start(dist_path).await {
            tracing::info!("[VibeAround] Fatal: {}", e);
        }
    });

    std::process::exit(0);
}
