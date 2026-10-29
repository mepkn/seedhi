#!/usr/bin/env bash
# Runs on the server as deploy, in /srv/guestbook: lesson 4.2's three commands
# (pull, migrate, start), then removes old images of this app. The deploy
# workflows send it over SSH with the four variables set:
#   ssh deploy@<server> "APP_ENV=staging PORT=3101 IMAGE=… TAG=… bash -s" < scripts/server-deploy.sh
set -euo pipefail

# With `bash -s` the script is read from stdin as it runs, and a command that
# reads stdin (docker compose run does) would swallow the rest of it. Inside a
# function, bash has read the whole script before the first command runs.
main() {
  : "${APP_ENV:?}" "${PORT:?}" "${IMAGE:?}" "${TAG:?}"
  export APP_ENV PORT IMAGE TAG
  cd /srv/guestbook

  local project="guestbook-$APP_ENV"
  docker compose -p "$project" pull --quiet
  docker compose -p "$project" run --rm -T migrate </dev/null
  docker compose -p "$project" up -d --wait --remove-orphans
  docker compose -p "$project" ps --format '{{.Name}} {{.Image}} {{.Status}}'

  # Keep the two newest images of this app, so the previous version is still
  # here for a quick rollback, and never touch an image a container uses (the
  # other environment's). `docker image ls` lists the newest first, one line
  # per tag; an image has two tags (lesson 4.1), so list each ID once.
  local in_use
  in_use=$(docker ps -aq | xargs -r docker inspect --format '{{.Image}}' | cut -c8-19)
  docker image ls "$IMAGE" --format '{{.ID}}' | awk '!seen[$0]++' | tail -n +3 |
    while read -r id; do
      grep -qx "$id" <<<"$in_use" && continue
      docker rmi -f "$id" >/dev/null
    done
  echo "kept: $(docker image ls "$IMAGE" --format '{{.Tag}}' | paste -sd ' ' -)"
}

main
