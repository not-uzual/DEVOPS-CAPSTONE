#!/usr/bin/env bash
# Discards the current 2 commits (M1, M2) and rebuilds history as a series of
# small, feature/fix-wise commits split by backend/frontend/infra.
#
# Safe to run only if this history was never pushed to a remote others rely on.
# This repo has no origin/main tracking yet, so that is the case right now.
#
# Usage: run from the repo root:
#   bash scripts/rebuild-git-history.sh

set -euo pipefail

if [ ! -d .git ]; then
  echo "Run this from the repository root (where .git lives)." >&2
  exit 1
fi

echo "Current working tree state (staged + unstaged changes shown here will be"
echo "folded into the new commits below, same as the committed files):"
git status --short
echo

echo "This will PERMANENTLY discard the current commit history:"
git log --oneline
read -r -p "Continue and rebuild history from scratch? [y/N] " ans
case "$ans" in
  y|Y) ;;
  *) echo "Aborted."; exit 1 ;;
esac

git checkout --orphan rebuild-history
git reset

commit() {
  local msg="$1"; shift
  git add -- "$@"
  git commit -q -m "$msg"
  echo "committed: $msg"
}

commit "chore: add gitignore and git history helper script" \
  .gitignore scripts/rebuild-git-history.sh

commit "docs: add project README, grading rubric and reference screenshots" \
  README.md GRADING.md REQ.md .dockerignore image*.png

commit "feat(backend): add FastAPI config, DB session and SQLAlchemy models" \
  backend/app/__init__.py backend/app/config.py backend/app/db.py backend/app/models.py backend/app/schemas.py

commit "feat(backend): add tasks REST API with health and readiness endpoints" \
  backend/app/main.py

commit "feat(backend): add Alembic migration for tasks table" \
  backend/alembic.ini backend/alembic/env.py backend/alembic/script.py.mako backend/alembic/versions/0001_create_tasks.py

commit "test(backend): add pytest suite with isolated sqlite test database" \
  backend/tests/test_api.py backend/tests/conftest.py backend/pytest.ini

commit "fix(backend): containerize FastAPI app with non-root user" \
  backend/requirements.txt backend/Dockerfile backend/.dockerignore backend/.env.example

commit "feat(frontend): add React dashboard UI for TaskBoard" \
  frontend/package.json frontend/vite.config.js frontend/index.html frontend/src/main.jsx frontend/src/styles.css

commit "fix(frontend): multi-stage Docker build serving via non-root Nginx on port 8080" \
  frontend/Dockerfile frontend/nginx.conf frontend/.dockerignore

commit "fix(compose): add postgres healthcheck so backend waits for DB readiness" \
  docker-compose.yml

commit "feat(infra): add Terraform AWS VPC and EKS infrastructure" \
  terraform/

commit "feat(k8s): add namespace manifest and Helm chart for backend/frontend/postgres" \
  k8s/namespace.yaml helm/

commit "feat(ci): add GitHub Actions pipeline for test, build, scan and deploy" \
  .github/workflows/ci-cd.yml

commit "feat(observability): add Prometheus scrape values for monitoring" \
  monitoring/

commit "feat(troubleshooting): add broken-image/broken-service labs and load-test script" \
  scripts/load-test.sh troubleshooting/

leftover="$(git status --porcelain)"
if [ -n "$leftover" ]; then
  echo "Files not covered by the plan above (new/renamed files) — sweeping into one final commit:" >&2
  echo "$leftover" >&2
  git add -A
  git commit -q -m "chore: add remaining project files"
fi

git branch -D main
git branch -m main

echo
echo "Done. New history:"
git log --oneline
