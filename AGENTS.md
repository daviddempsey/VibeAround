# Workspace workflow

- The build root is `src/`: Bun owns the frontend workspaces and lockfile; Cargo owns the Rust workspace and lockfile; Tauri packaging is driven by `src/desktop/tauri.conf.json`.
- Initialize `src/va-ai-api-proxy` with `git submodule update --init --recursive`. It is a separate repository pinned by a gitlink; update its upstream commit intentionally instead of vendoring changes into this repository.
- `src/resources/*.json`, `src/resources/profile-catalog/`, and `src/skills/` are compile-time sources embedded by Rust. Generated `dist/`, `target/`, `src/desktop/binaries/`, `src/desktop/gen/`, installers, and portable archives are build outputs; never edit or commit them.
- Agent IDs originate in `src/resources/agents.json` but have hand-maintained TypeScript mirrors in `src/shared/client-ts/src/schemas.ts` and display mappings in `src/web/src/lib/agents.ts`; update and build all three together.
- Rust wire types are authoritative for `src/shared/client-ts/src/schemas.ts`. When serialized API shapes change, update the matching Zod schema in the same change.
- Tauri dev/build hooks run `link-sdk.mjs` and generate the hook sidecar. Local SDK mode can rewrite plugin manifests under ignored `src/plugins/`; release mode must be restored before packaging. Do not commit generated sidecars or local plugin worktrees.
- Do not hand-edit Bun or Cargo lockfiles. Change manifests, then use the owning package manager. Keep release versions aligned across Cargo packages, JS packages, and Tauri configuration; `src/va-ai-api-proxy` is an independently versioned submodule and is excluded.

## Verification

```bash
cd src
bun run prebuild
cargo fmt --all -- --check
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
```

- When dependency installation is authorized, use `bun install --frozen-lockfile`. For desktop packaging changes also run `bun run build`; for resource-only changes, at minimum run `cargo test -p common resources::tests` plus the affected frontend build. Release creation, signing, notarization, and publishing require separate approval.
